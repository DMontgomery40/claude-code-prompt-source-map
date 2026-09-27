"""Paths shared by the video pipelines. Media and private sessions live under the repo's gitignored
private/ folder; session ids come from the environment, never from committed code.

  TRACE_CC_SESSION     folder of the frozen Claude Code session to film
                       (default: the only folder under private/sessions/claude-code/)
  TRACE_CODEX_THREAD   root thread id of the Codex/ChatGPT rollout family to film (teaser only)
"""
import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PRIVATE = REPO / "private"
CODEX_SESSIONS = Path(os.path.expanduser("~/.codex/sessions"))


def private_dir(*parts):
    """A folder under private/, created on first use."""
    d = PRIVATE.joinpath(*parts)
    d.mkdir(parents=True, exist_ok=True)
    return str(d)


def cc_session():
    env = os.environ.get("TRACE_CC_SESSION")
    if env:
        return env
    root = PRIVATE / "sessions" / "claude-code"
    dirs = sorted(p for p in root.iterdir() if p.is_dir()) if root.exists() else []
    if len(dirs) != 1:
        raise SystemExit(f"set TRACE_CC_SESSION (found {len(dirs)} session folders under {root})")
    return str(dirs[0])


def codex_thread():
    env = os.environ.get("TRACE_CODEX_THREAD")
    if not env:
        raise SystemExit("set TRACE_CODEX_THREAD to the root thread id of the Codex/ChatGPT rollout family")
    return env
