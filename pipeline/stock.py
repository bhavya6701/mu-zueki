"""Find and fetch free stock clips from Vecteezy for a week's reel.

    python -m pipeline.stock search "cell tower"            list the free clips for a search (id and title)
    python -m pipeline.stock get WEEK NAME ID-SLUG [SIZE]   download one into reel/media/WEEK/NAME.mp4

Only clips under Vecteezy's free licence are fetched (it requires attribution), and every download is
written to reel/media/WEEK/credits.json so the reel's description can credit them. SIZE is small,
medium, large (the default) or original.
"""
from __future__ import annotations

import html
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

from .settings import ROOT, RunError, log

SITE = "https://www.vecteezy.com"
AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
MEDIA_DIR = ROOT / "reel" / "media"


def _opener() -> urllib.request.OpenerDirector:
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    opener.addheaders = [("User-Agent", AGENT)]
    return opener


def _read(opener, url: str, headers: dict | None = None, timeout: int = 60) -> bytes:
    request = urllib.request.Request(url, headers=headers or {})
    try:
        with opener.open(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RunError(f"Vecteezy answered {exc.code} for {url}") from exc
    except OSError as exc:
        raise RunError(f"Vecteezy could not be reached: {exc}") from exc


def search(query: str, free_only: bool = True) -> list[tuple[str, str]]:
    """(id-slug, title) of the clips on the first page of a search; only the free ones unless told otherwise."""
    page = _read(_opener(), f"{SITE}/free-videos/{urllib.parse.quote(query.strip().lower().replace(' ', '-'))}").decode("utf-8", "replace")
    seen, out = set(), []
    for found in re.finditer(r'href="/video/(\d+-[^"]+)"', page):
        slug = found.group(1)
        if slug in seen:
            continue
        seen.add(slug)
        # Each result card says whether it is Free or Pro just before its link.
        marks = re.findall(r'item-pro-param="(\w+)"', page[:found.start()])
        if free_only and (not marks or marks[-1] != "Free"):
            continue
        out.append((slug, slug.split("-", 1)[1].replace("-", " ")))
    return out


def describe(page: str, slug: str) -> dict:
    """A clip's title and its contributor's member name, from its page."""
    title = re.search(r"<title>([^<|]+)", page)
    text = html.unescape(title.group(1)).strip() if title else slug
    author = re.search(r"/members/([A-Za-z0-9_-]+)", page)
    return {"title": re.sub(r"\s*\d+\s+Stock Video at Vecteezy$", "", text), "author": author.group(1) if author else None}


def get(week: str, name: str, slug: str, size: str = "large") -> dict:
    """Download a free clip and record its credit. Returns the credit entry."""
    opener = _opener()
    page_url = f"{SITE}/video/{slug}"
    page = _read(opener, page_url).decode("utf-8", "replace")
    if 'data-download-license-type-value="free"' not in page:
        raise RunError(f"{slug} is not under the free licence; pick another clip")
    found = re.search(r'data-download-dl-size-url-param="([^"]*size=' + re.escape(size) + r')"', page) \
        or re.search(r'data-download-download-path-value="([^"]*)"', page)
    if not found:
        raise RunError(f"No download link was found on {page_url}")
    answer = json.loads(_read(opener, SITE + html.unescape(found.group(1)),
                              {"Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "Referer": page_url}))
    if not answer.get("url"):
        raise RunError(f"Vecteezy did not give a file for {slug}: {str(answer)[:200]}")
    folder = MEDIA_DIR / week
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f"{name}.mp4"
    target.write_bytes(_read(opener, answer["url"], timeout=600))
    credit = {"name": name, "file": f"media/{week}/{target.name}", "source": "Vecteezy", "url": page_url,
              **describe(page, slug), "licence": "Vecteezy free licence (attribution required)"}
    ledger = folder / "credits.json"
    credits = [c for c in (json.loads(ledger.read_text(encoding="utf-8")) if ledger.exists() else []) if c["name"] != name]
    ledger.write_text(json.dumps(credits + [credit], indent=2) + "\n", encoding="utf-8")
    return credit


def main() -> int:
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    args = sys.argv[1:]
    try:
        if len(args) == 2 and args[0] == "search":
            for slug, title in search(args[1]):
                print(slug.split("-", 1)[0], "|", title[:110], "|", slug)
            return 0
        if len(args) in (4, 5) and args[0] == "get":
            credit = get(*args[1:])
            log(f"stock: saved {credit['file']} ({credit['title']})")
            return 0
        print(__doc__)
        return 1
    except RunError as exc:
        log(f"stock: FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
