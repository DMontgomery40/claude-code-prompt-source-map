"""Paths shared by the video pipelines. Media and private sessions live under the repo's gitignored
private/ folder; session ids come from the environment, never from committed code.

  TRACE_CC_SESSION     folder of the frozen Claude Code session to film
                       (default: the only folder under private/sessions/claude-code/)
  TRACE_CODEX_THREAD   root thread id of the Codex/ChatGPT rollout family to film (teaser only)

The tour (video/tour) also films the network layer, which needs a session log and the capture made
while it ran (see tools/capture/README.md):
  TRACE_NET_CC_SESSION   path of a Claude Code session .jsonl (its subagents/ folder is picked up beside it)
  TRACE_NET_CC_HAR       the HAR captured during that session
  TRACE_NET_CX_ROLLOUT   path of a Codex/ChatGPT rollout .jsonl
  TRACE_NET_CX_HAR       the HAR captured during that rollout
  TRACE_LEAK_VALUES      JSON list of private values no frame may show (default: private/leak-values.json)
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


def net_inputs(product):
    """(files to pick, in order: session log, subagent logs, HAR) for the network shots. product: 'cc' or 'cx'."""
    import glob
    sess = os.environ.get(f"TRACE_NET_{product.upper()}_SESSION" if product == "cc" else "TRACE_NET_CX_ROLLOUT")
    har = os.environ.get(f"TRACE_NET_{product.upper()}_HAR")
    if not sess or not har:
        raise SystemExit(f"set TRACE_NET_{'CC_SESSION' if product == 'cc' else 'CX_ROLLOUT'} and TRACE_NET_{product.upper()}_HAR")
    base = sess[:-len(".jsonl")]
    return [sess] + sorted(glob.glob(base + "/subagents/*.jsonl")) + [har]


def leak_values():
    """Values no filmed frame may show: the same set tools/leak-check.mjs forbids in the repo (this machine's
    home path, user name, git email, ~/.env and repo .env values, Codex auth and wrangler strings, every private
    session id under private/, and private/leak-values.json). Never committed; read fresh on every run."""
    import getpass, json, re, subprocess
    home = str(Path.home())
    vals = {home, getpass.getuser()}
    try:
        vals.add(subprocess.run(["git", "config", "--global", "user.email"], capture_output=True, text=True).stdout.strip())
    except OSError:
        pass
    for env in (Path.home() / ".env", REPO / ".env"):
        try:
            for line in open(env):
                m = re.match(r"\s*(?:export\s+)?[A-Z0-9_]+\s*=\s*(.*)", line)
                if m and len(m.group(1).strip().strip("\"'")) >= 12: vals.add(m.group(1).strip().strip("\"'"))
        except OSError:
            pass
    for f in (Path.home() / ".codex/auth.json", Path.home() / "Library/Preferences/.wrangler/config/default.toml"):
        try: vals.update(re.findall(r'"([^"\\]{20,})"', f.read_text()))
        except OSError: pass
    uuid = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
    roots = [PRIVATE / "sessions"] + [d / "sessions" for d in (PRIVATE / "research").glob("*")]
    for root in roots:
        if root.exists():
            for p in root.rglob("*"): vals.update(uuid.findall(p.name))
    f = Path(os.environ.get("TRACE_LEAK_VALUES", PRIVATE / "leak-values.json"))
    try:
        v = json.load(open(f))
        if isinstance(v, dict): v = [x for xs in v.values() for x in (xs if isinstance(xs, list) else [xs])]
        vals.update(x for x in v if isinstance(x, str))
    except (OSError, ValueError):
        pass
    return sorted(x for x in vals if x and len(x) >= 6)


def elevenlabs_key():
    """ELEVENLABS_API_KEY from the environment, else from the repo's gitignored .env (never committed)."""
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    try:
        for line in open(REPO / ".env"):
            k, _, v = line.strip().removeprefix("export ").partition("=")
            if k == "ELEVENLABS_API_KEY":
                return v.strip().strip("\"'")
    except OSError:
        pass
    return None
