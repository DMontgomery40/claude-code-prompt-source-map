#!/usr/bin/env python3
"""Ask the shipped binary whether it accepts disputed config keys.

For each candidate from 02_extract.py (hidden fields, aliases, keys documented but missing
from the schema) this writes a one-key config.toml into a throwaway CODEX_HOME and runs
`codex --strict-config archive <nil-uuid>`. Outcomes, calibrated by the control probes:
  "failed to load config.toml"    unknown field or wrong type while parsing (strict mode)
  "failed to load configuration"  parsed, then rejected by later validation
  anything else                   config loaded; the run then fails on the missing session
Permission profiles turn out not to be strictly checked, so probes there are inconclusive.
The user's ~/.codex is never used.

Usage: 03_probe_strict_config.py   (then re-run 02_extract.py to fold results in)
"""
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CAP = REPO / "work" / "codex-config"
CODEX = os.environ.get("CODEX_BIN") or subprocess.run(
    ["node", str(REPO / "extract/codex/lib/app-layout.mjs"), "entrypoint"],
    capture_output=True, text=True, check=True).stdout.strip()
NIL = "00000000-0000-0000-0000-000000000000"

PLACEHOLDER_VALUES = {"<path>": "/tmp", "<path-or-glob>": "/tmp", "<pattern>": "example.com",
                      "<subpath-or-glob>": "docs"}

# Values for keys whose type the schema does not state.
OVERRIDES = {
    "js_repl_node_path": '"/usr/bin/node"',
    "profiles.<name>.js_repl_node_path": '"/usr/bin/node"',
    "js_repl_node_module_dirs": '["/tmp"]',
    "profiles.<name>.js_repl_node_module_dirs": '["/tmp"]',
    "experimental_thread_store_endpoint": '"http://127.0.0.1:1"',
    "agents.job_max_runtime_seconds": "60",
    "agents.max_threads": "2",
    "ghost_snapshot.ignore_untracked_files_over_bytes": "1",
    "ghost_snapshot.large_untracked_dir_warning_threshold": "1",
    "memories.no_memories_if_mcp_or_web_search": "true",
    "mcp_servers.<id>.bearer_token": '"x"',
    "mcp_servers.<id>.experimental_environment": '"local"',
    "desktop.custom_file_handlers.<id>.input": '"path"',
    "permissions.<name>.network.mode": '"limited"',
    "permissions.<name>.network.domains.<pattern>": '"allow"',
    "permissions.<name>.network.unix_sockets.<path>": '"allow"',
    "permissions.<name>.filesystem.<path-or-glob>": '"read"',
    'permissions.<name>.filesystem.":workspace_roots".<subpath-or-glob>': '"read"',
    "permissions.<name>.extends": '":read-only"',
}

SPECIAL_DOCS = {
    'experimental_thread_store.type = "in_memory"': '[experimental_thread_store]\ntype = "in_memory"\nid = "probe"\n',
    "mcp_servers.<id>": None,
}


def value_for(path: str, typ: str | None) -> str:
    if path in OVERRIDES:
        return OVERRIDES[path]
    t = (typ or "").lower()
    if t.startswith("bool"):
        return "true"
    if t.startswith(("integer", "number")):
        return "1"
    if t.startswith("array"):
        return "[]"
    if t in ("table",) or t.startswith("map"):
        return "{}"
    m = re.match(r'^"?([a-z_\-]+)"?\s*\|', t)
    if m:
        return json.dumps(m.group(1))
    return '"x"'


def toml_for(path: str, typ: str | None) -> str:
    if path in SPECIAL_DOCS and SPECIAL_DOCS[path]:
        return SPECIAL_DOCS[path]
    segs, cur, quoted = [], "", False
    for ch in path:
        if ch == '"':
            quoted = not quoted
        if ch == "." and not quoted:
            segs.append(cur)
            cur = ""
        else:
            cur += ch
    segs.append(cur)
    resolved = []
    for s in segs:
        if s.startswith("<"):
            resolved.append(json.dumps(PLACEHOLDER_VALUES.get(s, "probe")))
        elif re.match(r"^[A-Za-z0-9_-]+$", s):
            resolved.append(s)
        else:
            resolved.append(s if s.startswith('"') else json.dumps(s))
    key = resolved[-1]
    table = ".".join(resolved[:-1])
    body = f"{key} = {value_for(path, typ)}\n"
    extra = ""
    if path.startswith("mcp_servers.") and not path.endswith(".command"):
        extra = 'command = "true"\n'
    return (f"[{table}]\n" if table else "") + extra + body


def classify(out: str) -> str:
    if "failed to load config.toml" in out:
        return "rejected while parsing config.toml (unknown field or wrong type)"
    if "failed to load configuration" in out:
        return "parsed, then rejected by later config validation"
    return "accepted (config loaded)"


def run(toml: str) -> tuple[str, str]:
    home = tempfile.mkdtemp(prefix="codex-probe-")
    try:
        Path(home, "config.toml").write_text(toml)
        env = {k: v for k, v in os.environ.items() if not k.startswith(("CODEX_", "OPENAI_"))}
        env["CODEX_HOME"] = home
        p = subprocess.run([CODEX, "--strict-config", "archive", NIL], capture_output=True, text=True, env=env, timeout=60)
        out = (p.stdout + p.stderr).replace(home, "$CODEX_HOME")
        out = re.sub(r"/(?:Users|home)/[^\s/]+", "~", out)
        return classify(out), out.strip()[:300]
    finally:
        shutil.rmtree(home, ignore_errors=True)


def main():
    cands = json.loads((CAP / "probe-candidates.json").read_text())
    seen, results = set(), []
    controls = [
        ("<control: known key>", 'model = "probe"\n'),
        ("<control: unknown key>", "zz_not_a_codex_key = 1\n"),
        ("<control: wrong type>", '[agents]\nmax_concurrent_threads_per_session = "x"\n'),
        # Permission profiles are not strictly checked: a bogus key inside a complete profile loads.
        ("<control: unknown key inside a permissions profile>",
         'default_permissions = "probe"\n[permissions.probe]\nzz_bogus = "x"\n[permissions.probe.filesystem]\n"/tmp" = "read"\n'),
    ]
    for name, toml in controls:
        res, out = run(toml)
        results.append({"path": name, "toml": toml, "accepted": res.startswith("accepted"), "result": res, "output": out})
    lenient_permissions = results[-1]["accepted"]
    for c in cands:
        if c["path"] in seen:
            continue
        seen.add(c["path"])
        if c["path"].startswith("permissions.") and lenient_permissions:
            results.append({"path": c["path"], "toml": None, "accepted": None,
                            "result": "inconclusive: permission profiles accept unknown keys, so a probe cannot confirm this field",
                            "output": None})
            continue
        toml = toml_for(c["path"], c.get("type"))
        res, out = run(toml)
        entry = {"path": c["path"], "toml": toml, "accepted": res.startswith("accepted"), "result": res, "output": out}
        if not entry["accepted"]:
            # Baseline: the same file without the disputed line. If that fails too, the parent
            # table (not the key) caused the rejection and the probe says nothing about the key.
            baseline = "".join(toml.splitlines(keepends=True)[:-1])
            bres, _ = run(baseline)
            entry["baseline_toml"] = baseline
            entry["baseline_result"] = bres
            if not bres.startswith("accepted"):
                entry["accepted"] = None
                entry["result"] = f"inconclusive: the parent table alone was also rejected ({bres})"
        results.append(entry)
    (CAP / "probe-results.json").write_text(json.dumps(results, indent=1))
    for r in results:
        print(f"{r['result'][:40]:42} {r['path']}")


if __name__ == "__main__":
    main()
