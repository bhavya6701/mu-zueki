"""Post a day's reel to Instagram: python -m pipeline.instagram DATE [--draft] [--check] [--again]

Each post lives in instagram/posts/DATE/: reel.mp4 (a copy of the day's reel), caption.txt (the
description) and post.json (draft or posted, with the link). --draft only fills that folder.

Uses Meta's official content publishing API. With a token from Instagram Login (it starts with IG),
Instagram fetches the video from a public link, so the reel is put on your Vercel Blob store for the
minute the post takes and deleted again afterwards. With a Facebook Login token the file is uploaded
to Meta directly. Needs a professional (creator or business) Instagram account and, in config/.env:

    INSTAGRAM_ACCESS_TOKEN=...   a long-lived token with permission to publish content
    INSTAGRAM_USER_ID=...        optional: the account's numeric id. Left out, the token's own account is used
    INSTAGRAM_GRAPH_HOST=...     optional: graph.instagram.com (Instagram Login, the default) or
                                 graph.facebook.com (Facebook Login with a Page token)
    BLOB_READ_WRITE_TOKEN=...    the Vercel Blob store's token (Instagram Login only); the upload is
                                 done with the `vercel` command, which must be installed

--check only tests the credentials and shows the account; nothing is posted.
--again posts a day a second time (a posted day is otherwise refused).
Posting is public and cannot be taken back from here, so this is run only after the reel is approved.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .day import Day
from .settings import DATE_RE, ENV_PATH, OUTPUT_DIR, ROOT, RunError, log

API_VERSION = "v25.0"
DEFAULT_HOST = "graph.instagram.com"
UPLOAD_URL = "https://rupload.facebook.com/ig-api-upload"
CAPTION_LIMIT = 2200
POSTS_DIR = ROOT / "instagram" / "posts"
BLOB_TOKEN = "BLOB_READ_WRITE_TOKEN"
DIRECT_UPLOAD_HOST = "graph.facebook.com"


def read_env(env_file: Path = ENV_PATH) -> dict:
    """NAME=value pairs from config/.env, overridden by the real environment."""
    values = {}
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8-sig").splitlines():
            name, _, value = line.partition("=")
            name = name.strip().removeprefix("export ").strip()
            if (name.startswith("INSTAGRAM_") or name == BLOB_TOKEN) and value.strip():
                values[name] = value.strip().strip("'\"")
    values.update({k: v.strip() for k, v in os.environ.items()
                   if (k.startswith("INSTAGRAM_") or k == BLOB_TOKEN) and v.strip()})
    return values


def credentials(env: dict) -> tuple[str, str, str]:
    if not env.get("INSTAGRAM_ACCESS_TOKEN"):
        raise RunError("INSTAGRAM_ACCESS_TOKEN is missing from config/.env (see \"Posting to Instagram\" in README.md)")
    # "me" is the account the token was generated for, which is the only one this pipeline posts to.
    return env["INSTAGRAM_ACCESS_TOKEN"], env.get("INSTAGRAM_USER_ID", "me"), env.get("INSTAGRAM_GRAPH_HOST", DEFAULT_HOST)


def call(url: str, method: str = "GET", params: dict | None = None, headers: dict | None = None,
         body: bytes | None = None, timeout: int = 120) -> dict:
    """One request to Meta. Returns the JSON reply or raises RunError with Meta's own message."""
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail)["error"]["message"]
        except (ValueError, KeyError, TypeError):
            detail = detail[:300]
        raise RunError(f"Instagram refused the request (HTTP {exc.code}): {detail}")
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RunError(f"Could not reach Instagram: {exc}")


def account(token: str, user_id: str, host: str, http=call) -> dict:
    """The account the credentials belong to. Proves they work without posting anything."""
    return http(f"https://{host}/{API_VERSION}/{user_id}", params={"fields": "username", "access_token": token})


def _vercel(args: list[str], blob_token: str, run=subprocess.run) -> str:
    """Run a `vercel blob` command with the store's token in the environment (never on the command line)."""
    exe = shutil.which("vercel")
    if not exe:
        raise RunError("The 'vercel' command was not found on PATH (npm i -g vercel)")
    result = run([exe, "blob", *args], capture_output=True, text=True, encoding="utf-8", errors="replace",
                 timeout=900, env={**os.environ, BLOB_TOKEN: blob_token}, stdin=subprocess.DEVNULL)
    output = (result.stdout or "") + (result.stderr or "")
    if result.returncode != 0:
        raise RunError(f"vercel blob {args[0]} failed: {output.strip()[-300:]}")
    return output


def host_video(reel: Path, name: str, blob_token: str, run=subprocess.run) -> str:
    """Put the reel on the Vercel Blob store and return its public link."""
    output = _vercel(["put", str(reel), "--access", "public", "--pathname", f"reels/{name}.mp4",
                      "--add-random-suffix", "true"], blob_token, run)
    found = re.search(r"https://\S+\.blob\.vercel-storage\.com/\S+\.mp4", output)
    if not found:
        raise RunError(f"The upload to Vercel Blob gave no link: {output.strip()[-300:]}")
    return found.group(0)


def unhost_video(url: str, blob_token: str, run=subprocess.run) -> None:
    """Delete the hosted copy again."""
    _vercel(["del", url], blob_token, run)


def publish(reel: Path, caption: str, token: str, user_id: str, host: str, http=call, wait=time.sleep,
            cover_at: float | None = None, video_url: str | None = None) -> dict:
    """Publish the reel. Returns {"id", "permalink"} of the post.

    With video_url Instagram fetches the video from that public link; without it the file is uploaded to
    Meta directly (Facebook Login tokens only). cover_at is the second of the video to use as the cover
    image; without it Instagram uses the first frame.
    """
    if len(caption) > CAPTION_LIMIT:
        raise RunError(f"The caption is {len(caption)} characters; Instagram allows {CAPTION_LIMIT}")
    base = f"https://{host}/{API_VERSION}"
    params = {"media_type": "REELS", "caption": caption, "access_token": token}
    params.update({"video_url": video_url} if video_url else {"upload_type": "resumable"})
    if cover_at is not None:
        params["thumb_offset"] = str(int(cover_at * 1000))  # milliseconds
    container = http(f"{base}/{user_id}/media", method="POST", params=params)
    container_id = container["id"]

    if not video_url:
        data = reel.read_bytes()
        log(f"instagram: uploading {reel.name} ({len(data) / 1e6:.1f} MB)")
        uploaded = http(f"{UPLOAD_URL}/{API_VERSION}/{container_id}", method="POST", body=data, timeout=900,
                        headers={"Authorization": f"OAuth {token}", "offset": "0", "file_size": str(len(data))})
        if not uploaded.get("success"):
            raise RunError(f"The upload was not accepted: {uploaded}")

    # Meta processes the video before it can be published; this usually takes under a minute.
    for _ in range(30):
        status = http(f"{base}/{container_id}", params={"fields": "status_code,status", "access_token": token})
        if status.get("status_code") == "FINISHED":
            break
        if status.get("status_code") in ("ERROR", "EXPIRED"):
            raise RunError(f"Instagram could not process the reel: {status.get('status', status.get('status_code'))}")
        wait(10)
    else:
        raise RunError("Instagram was still processing the reel after 5 minutes; it was not published")

    post = http(f"{base}/{user_id}/media_publish", method="POST", params={"creation_id": container_id, "access_token": token})
    link = http(f"{base}/{post['id']}", params={"fields": "permalink", "access_token": token})
    return {"id": post["id"], "permalink": link.get("permalink", "")}


def stage(day: Day, posts_dir: Path = POSTS_DIR) -> Path:
    """Fill instagram/posts/DATE/ with the day's reel and a caption, as a draft. Returns the folder.

    The reel is copied again if the day's reel has changed. A caption already in the folder is kept:
    that is where the approved description is written. Without one, the song's caption.txt is used.
    """
    reel = day.dir / "reel.mp4"
    if not reel.exists():
        raise RunError(f"There is no reel.mp4 for {day.date} yet")
    folder = posts_dir / day.date
    folder.mkdir(parents=True, exist_ok=True)
    copy = folder / "reel.mp4"
    if not copy.exists() or copy.stat().st_size != reel.stat().st_size or copy.stat().st_mtime < reel.stat().st_mtime:
        shutil.copy2(reel, copy)
    caption = folder / "caption.txt"
    if not caption.exists():
        caption.write_text(day.caption_txt.read_text(encoding="utf-8").strip() + "\n", encoding="utf-8")
    record = folder / "post.json"
    if not record.exists():
        write_record(record, {"date": day.date, "status": "draft"})
    return folder


def write_record(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(prog="pipeline.instagram", description="Post a day's reel to Instagram.")
    parser.add_argument("date", nargs="?", help="the day to post, such as 2026-10-08")
    parser.add_argument("--draft", action="store_true", help="only fill instagram/posts/DATE/; post nothing")
    parser.add_argument("--check", action="store_true", help="test the credentials and show the account; post nothing")
    parser.add_argument("--again", action="store_true", help="post even though this day was already posted")
    args = parser.parse_args()
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        if args.check:
            token, user_id, host = credentials(read_env())
            log(f"instagram: the credentials work for @{account(token, user_id, host).get('username', '?')}")
            return 0
        if not args.date or not DATE_RE.match(args.date):
            raise RunError("Give the day to post, such as 2026-10-08")
        folder = stage(Day(OUTPUT_DIR, args.date))
        record = folder / "post.json"
        if args.draft:
            log(f"instagram: draft ready in {folder.relative_to(ROOT)}")
            return 0
        posted = json.loads(record.read_text(encoding="utf-8"))
        if posted.get("status") == "posted" and not args.again:
            raise RunError(f"{args.date} was already posted: {posted.get('permalink')} (--again posts it a second time)")
        env = read_env()
        token, user_id, host = credentials(env)
        caption = (folder / "caption.txt").read_text(encoding="utf-8").strip()
        reel, cover_at, video_url = folder / "reel.mp4", posted.get("cover_at_seconds"), None
        if host != DIRECT_UPLOAD_HOST:
            if not env.get(BLOB_TOKEN):
                raise RunError(f"{BLOB_TOKEN} is missing from config/.env (see \"Posting to Instagram\" in README.md)")
            log("instagram: putting the reel on Vercel Blob so Instagram can fetch it")
            video_url = host_video(reel, args.date, env[BLOB_TOKEN])
        try:
            post = publish(reel, caption, token, user_id, host, cover_at=cover_at, video_url=video_url)
        finally:
            if video_url:
                try:
                    unhost_video(video_url, env[BLOB_TOKEN])
                except RunError as exc:
                    log(f"instagram: the hosted copy was not deleted ({exc}); remove it in the Vercel dashboard")
        write_record(record, {**posted, "status": "posted", **post,
                              "posted_at": dt.datetime.now().isoformat(timespec="seconds")})
        log(f"instagram: posted {args.date}: {post['permalink']}")
        return 0
    except RunError as exc:
        log(f"instagram: FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
