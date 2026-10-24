"""ElevenLabs Music API: compose a song from a composition plan, and read the credit balance."""
from __future__ import annotations

import http.client
import json
import math
import os
import urllib.error
import urllib.request
from pathlib import Path

from .settings import ENV_PATH

API_URL = "https://api.elevenlabs.io/v1/music"
SUBSCRIPTION_URL = "https://api.elevenlabs.io/v1/user/subscription"
OUTPUT_FORMAT = "mp3_44100_128"
KEY_NAMES = ("ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY")
# Measured on this account: 14 short probes and 3 full takes cost 4.6 to 7 credits per second.
# This budgets on the high side; the real cost is read from the account balance afterwards.
CREDITS_PER_MINUTE = 450
PLAN_CHUNK_FIELDS = ("text", "duration_ms", "positive_styles", "negative_styles", "context_adherence")


class AudioError(RuntimeError):
    def __init__(self, message: str, suggestion: dict | None = None):
        super().__init__(message)
        self.suggestion = suggestion


def load_api_key(env_file: Path = ENV_PATH) -> str | None:
    """The key from the environment, or from config/.env (NAME=value lines)."""
    for name in KEY_NAMES:
        key = os.environ.get(name, "").strip()
        if key:
            return key
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8-sig").splitlines():
            name, _, value = line.partition("=")
            if name.strip().removeprefix("export ").strip() in KEY_NAMES:
                value = value.strip().strip("'\"")
                if value:
                    return value
    return None


def plan_seconds(plan: dict) -> float:
    return sum(chunk["duration_ms"] for chunk in plan["chunks"]) / 1000


def estimate_credits(plan: dict) -> int:
    return math.ceil(plan_seconds(plan) / 60 * CREDITS_PER_MINUTE)


def get_credits(api_key: str, timeout: int = 30) -> tuple[int, int] | None:
    """(credits used, credit limit) for the current billing period, or None if it cannot be read."""
    request = urllib.request.Request(SUBSCRIPTION_URL, headers={"xi-api-key": api_key})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        return int(data["character_count"]), int(data["character_limit"])
    except (OSError, http.client.HTTPException, ValueError, KeyError, TypeError):
        return None


def request_plan(plan: dict) -> dict:
    """The plan as the API expects it: only known fields, no empty optional ones."""
    return {"chunks": [
        {k: chunk[k] for k in PLAN_CHUNK_FIELDS if chunk.get(k) not in (None, "", [])} for chunk in plan["chunks"]
    ]}


def _find_key(data, name: str):
    if isinstance(data, dict):
        if name in data:
            return data[name]
        data = list(data.values())
    if isinstance(data, list):
        for item in data:
            found = _find_key(item, name)
            if found is not None:
                return found
    return None


def post(api_key: str, body: dict, timeout: int = 600) -> bytes:
    request = urllib.request.Request(
        f"{API_URL}?output_format={OUTPUT_FORMAT}",
        data=json.dumps(body).encode("utf-8"),
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            content_type, audio = response.headers.get("Content-Type", ""), response.read()
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except json.JSONDecodeError:
            detail = None
        hints = {401: "the API key was rejected", 429: "rate limit or quota reached"}
        hint = f" ({hints[exc.code]})" if exc.code in hints else ""
        raise AudioError(
            f"ElevenLabs returned HTTP {exc.code}{hint}: {raw[:400]}",
            suggestion=_find_key(detail, "composition_plan_suggestion"),
        )
    except (urllib.error.URLError, TimeoutError) as exc:
        raise AudioError(f"Could not reach ElevenLabs: {exc}")
    if "json" in content_type.lower() or not audio:
        raise AudioError(f"ElevenLabs replied without audio: {audio[:300]!r}")
    return audio


def compose(api_key: str, plan: dict, model_id: str, http_post=post) -> bytes:
    """MP3 bytes for the plan. If ElevenLabs rejects the styles and offers a corrected plan, that is used once."""
    body = {"composition_plan": request_plan(plan), "model_id": model_id}
    try:
        return http_post(api_key, body)
    except AudioError as exc:
        if not isinstance(exc.suggestion, dict) or "chunks" not in exc.suggestion:
            raise
        body["composition_plan"] = exc.suggestion
        return http_post(api_key, body)
