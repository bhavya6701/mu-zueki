"""Ask Claude for structured output through the installed `claude` command (uses the existing login)."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from .settings import RunError


def ask(system_text: str, user_text: str, schema: dict, model: str, timeout: int = 900, tools: str = "") -> dict:
    """`tools` is a comma-separated list of tools Claude may use, such as "WebSearch,WebFetch"; none by default."""
    exe = shutil.which("claude")
    if not exe:
        raise RunError("The 'claude' command was not found on PATH")
    with tempfile.TemporaryDirectory() as tmp:
        system_file = Path(tmp) / "system.md"
        system_file.write_text(system_text, encoding="utf-8")
        cmd = [
            exe, "-p",
            "--system-prompt-file", str(system_file),
            "--json-schema", json.dumps(schema),
            "--output-format", "json",
            "--tools", tools,
            "--no-session-persistence",
            "--strict-mcp-config",
            # No user/project settings: keeps plugin hooks out of the run. Login is unaffected.
            "--setting-sources", "",
            "--model", model,
        ]
        if tools:
            # Nobody is there to approve a tool in a headless run, so the named tools are allowed up front.
            cmd += ["--allowedTools", *tools.split(",")]
        flags = 0x08000000 if sys.platform == "win32" else 0  # CREATE_NO_WINDOW
        try:
            proc = subprocess.run(
                cmd, input=user_text, capture_output=True, text=True, encoding="utf-8",
                timeout=timeout, cwd=tmp, creationflags=flags,
            )
        except subprocess.TimeoutExpired:
            raise RunError(f"Claude did not answer within {timeout} seconds")
    try:
        reply = json.loads(proc.stdout)
    except json.JSONDecodeError:
        detail = (proc.stderr or proc.stdout or "").strip()[:500]
        raise RunError(f"Claude returned no JSON (exit {proc.returncode}): {detail}")
    if reply.get("is_error"):
        raise RunError(f"Claude reported an error: {str(reply.get('result'))[:500]}")
    data = reply.get("structured_output")
    if data is None:
        try:
            data = json.loads(reply.get("result") or "")
        except json.JSONDecodeError:
            raise RunError("Claude's answer did not contain the structured output")
    return data
