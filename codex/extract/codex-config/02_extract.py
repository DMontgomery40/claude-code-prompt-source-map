#!/usr/bin/env python3
"""Build the Codex config.toml and environment-variable references.

Inputs (all produced by the other scripts in this folder, under the gitignored work/):
  work/codex-src/                  openai/codex cloned at TAG (00_fetch_sources.sh)
  work/codex-config/               binary captures (01_capture_binary.sh), docs HTML
                                   (00_fetch_sources.sh), strict-config probes (03_probe_strict_config.py)
  work/asar-build/                 .vite/build/*.js extracted from app.asar (00_fetch_sources.sh)

Outputs:
  outputs/codex-config.{json,md}
  outputs/codex-env-vars.{json,md}

Nothing here reads ~/.codex. Every binary run in this pipeline uses a throwaway CODEX_HOME.
"""
from __future__ import annotations

import os
import subprocess

import collections
import html
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WORK = REPO / "work"
SRC = WORK / "codex-src"
RS = SRC / "codex-rs"
CAP = WORK / "codex-config"
DOCS = CAP / "docs"
ASAR = WORK / "asar-build"
OUT = REPO / "outputs"

# The release tag and app version come from the installed app, via 00_fetch_sources.sh.
TAG = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "work", "codex-config", "tag.txt")).read().strip()
APP_VERSION = subprocess.run(["/usr/libexec/PlistBuddy", "-c", "Print CFBundleShortVersionString", os.path.join(os.environ.get("CODEX_APP_PATH", "/Applications/ChatGPT.app"), "Contents/Info.plist")], capture_output=True, text=True, check=True).stdout.strip()
CLI_VERSION = (CAP / "version.txt").read_text().strip()
BIN_SHA = (CAP / "codex.sha256").read_text().strip()
BIN_PROV = f"codex binary sha256 {BIN_SHA} ({CLI_VERSION})"
DOCS_BASE = "https://developers.openai.com/codex/"
CONFIG_REF_URL = DOCS_BASE + "config-file/config-reference"
ENV_DOC_URL = DOCS_BASE + "config-file/environment-variables"
ASAR_JS = {p.name: p for p in sorted(ASAR.glob("*.js"))}


def src_prov(rel: str, line: int | None = None, note: str | None = None) -> dict:
    p = {"source": f"codex-rs@{TAG}:{rel}" + (f":{line}" if line else "")}
    if note:
        p["note"] = note
    return p


def short(text: str | None, limit: int = 360) -> str | None:
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("](/codex/", "](" + DOCS_BASE)  # docs-relative links
    if len(text) <= limit:
        return text
    cut = text[:limit]
    dot = cut.rfind(". ")
    return (cut[: dot + 1] if dot > limit * 0.5 else cut.rstrip() + " …")


# --------------------------------------------------------------------------------------
# Binary captures
# --------------------------------------------------------------------------------------
STRINGS = (CAP / "codex.strings.txt").read_text(errors="replace")


def binary_presence(token: str) -> dict:
    present = token in STRINGS
    distinctive = len(token) >= 8 and ("_" in token or "-" in token)
    return {
        "present": present,
        "strength": ("distinctive" if distinctive else "generic") if present else None,
    }


def load_features_list() -> dict:
    out = {}
    for line in (CAP / "features-list.txt").read_text().splitlines():
        m = re.match(r"^(\S+)\s{2,}(.+?)\s{2,}(true|false)\s*$", line)
        if m:
            out[m.group(1)] = {"stage": m.group(2).strip(), "enabled": m.group(3) == "true"}
    return out


PROBES = {}
probe_file = CAP / "probe-results.json"
if probe_file.exists():
    for r in json.loads(probe_file.read_text()):
        PROBES[r["path"]] = r

# --------------------------------------------------------------------------------------
# Rust source index
# --------------------------------------------------------------------------------------
def is_test_path(rel: str) -> bool:
    return (
        rel.endswith("_tests.rs")
        or rel.endswith("/tests.rs")
        or "/tests/" in rel
        or "/test_support" in rel
        or rel.endswith("test_support.rs")
        or "/benches/" in rel
        or "/examples/" in rel
        or "test-client" in rel
        or "mock-client" in rel
        or "/test-" in rel
        or "_test_" in rel
    )


RS_FILES: dict[str, list[str]] = {}
for p in sorted(RS.rglob("*.rs")):
    rel = p.relative_to(SRC).as_posix()
    if "/target/" in rel or is_test_path(rel):
        continue
    lines = p.read_text(errors="replace").splitlines()
    # Drop inline `#[cfg(test)] mod x { ... }` blocks (by convention at file end).
    for i, ln in enumerate(lines):
        if ln.strip() == "#[cfg(test)]" and i + 1 < len(lines) and re.match(r"^\s*(pub\s+)?mod\s+\w+\s*\{", lines[i + 1]):
            lines = lines[:i]
            break
    RS_FILES[rel] = lines

DEF_INDEX: dict[str, list[tuple[str, int, str]]] = collections.defaultdict(list)
for rel, lines in RS_FILES.items():
    for i, ln in enumerate(lines):
        m = re.match(r"^\s*pub(?:\([^)]*\))?\s+(struct|enum)\s+(\w+)", ln)
        if m:
            DEF_INDEX[m.group(2)].append((rel, i + 1, m.group(1)))

PREFERRED_DIRS = ["codex-rs/config/", "codex-rs/features/", "codex-rs/protocol/", "codex-rs/model-provider-info/",
                  "codex-rs/core/", "codex-rs/"]


def find_def(defname: str):
    base = re.sub(r"_for_.*$", "", defname)
    cands = DEF_INDEX.get(defname) or DEF_INDEX.get(base) or []
    for pref in PREFERRED_DIRS:
        for c in cands:
            if c[0].startswith(pref):
                return c
    return None


def find_field(defname: str, field: str):
    d = find_def(defname)
    if not d:
        return None
    rel, line, _ = d
    lines = RS_FILES[rel]
    end = len(lines)
    for j in range(line, len(lines)):
        if lines[j].startswith("}"):
            end = j
            break
    field_re = re.compile(rf"^\s*(?:pub(?:\([^)]*\))?\s+)?(?:r#)?{re.escape(field.replace('-', '_'))}\s*:")
    rename_re = re.compile(rf'rename\s*=\s*"{re.escape(field)}"')
    pending_rename = False
    for j in range(line - 1, end):
        if rename_re.search(lines[j]):
            pending_rename = True
            continue
        if pending_rename and re.match(r"^\s*(?:pub(?:\([^)]*\))?\s+)?\w+\s*:", lines[j]):
            return rel, j + 1
        if field_re.match(lines[j]):
            return rel, j + 1
    return rel, line


def doc_comment_above(rel: str, line: int, max_lines: int = 6) -> str | None:
    lines = RS_FILES.get(rel, [])
    out = []
    j = line - 2
    while j >= 0 and len(out) < 40:
        s = lines[j].strip()
        if s.startswith("#["):
            j -= 1
            continue
        if s.startswith("///") or s.startswith("//"):
            out.append(re.sub(r"^//+\s?", "", s))
            j -= 1
            continue
        break
    out.reverse()
    return " ".join(out[:max_lines]) if out else None


# --------------------------------------------------------------------------------------
# Official docs
# --------------------------------------------------------------------------------------
DOC_PAGES = {}
for line in (DOCS / "pages.txt").read_text().splitlines():
    slug, fname, _size = line.split()
    DOC_PAGES[slug] = html.unescape((DOCS / fname).read_text(errors="replace"))


def main_text(page: str) -> str:
    i, j = page.find("<main"), page.find("</main>")
    body = page[i:j] if i >= 0 and j > i else page
    body = re.sub(r"<script.*?</script>", " ", body, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body))


DOC_TEXT = {slug: main_text(p) for slug, p in DOC_PAGES.items() if not slug.endswith(".json")}


def code_spans(page: str) -> list[str]:
    i, j = page.find("<main"), page.find("</main>")
    body = page[i:j] if i >= 0 and j > i else page
    return [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", c)) for c in re.findall(r"<code[^>]*>(.*?)</code>", body, re.S)]


DOC_CODE = {slug: code_spans(p) for slug, p in DOC_PAGES.items() if not slug.endswith(".json")}


def mentioned_in_code(token: str, skip: str, bare_word: bool = False) -> list[str]:
    """Docs pages whose code spans mention the token. A bare single-word config key only
    counts when it appears as `key =` or `[key]`, so English words do not match."""
    if bare_word:
        rx = re.compile(rf"(?:^|\n|\s)(?:{re.escape(token)}\s*=|\[{re.escape(token)}[.\]])")
    else:
        rx = re.compile(rf"(?<![A-Za-z0-9_.]){re.escape(token)}(?![A-Za-z0-9_])")
    return [DOCS_BASE + slug for slug, spans in DOC_CODE.items() if slug != skip and any(rx.search(c) for c in spans)]

ref_page = DOC_PAGES["config-file/config-reference"]
entry_re = re.compile(r'\{"key":\[0,("(?:[^"\\]|\\.)*")\],"type":\[0,("(?:[^"\\]|\\.)*")\],"description":\[0,("(?:[^"\\]|\\.)*")\]\}')
islands = [m.start() for m in re.finditer(r"<astro-island[^>]*ConfigTable", ref_page)]
DOCS_CONFIG: dict[str, dict] = {}
DOCS_REQUIREMENTS: dict[str, dict] = {}
for m in entry_re.finditer(ref_page):
    key, typ, desc = (json.loads(m.group(k)) for k in (1, 2, 3))
    target = DOCS_REQUIREMENTS if len(islands) > 1 and m.start() > islands[1] else DOCS_CONFIG
    target.setdefault(key, {"type": typ, "description": desc})


def norm_path(p: str) -> str:
    p = re.sub(r"\s*=\s*.*$", "", p)  # docs rows such as `tui.keymap.<context>.<action> = []`
    p = re.sub(r"\.<index>", "[]", p)
    return re.sub(r"<[^>]+>", "<*>", p)


def segments(p: str) -> list[str]:
    out, cur, quoted = [], "", False
    for ch in norm_path(p).replace("[]", ".[]"):
        if ch == '"':
            quoted = not quoted
        if ch == "." and not quoted:
            if cur:
                out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def seg_match(a: str, b: str) -> bool:
    """Segment-wise match where a `<placeholder>` on either side matches any one segment."""
    sa, sb = segments(a), segments(b)
    return len(sa) == len(sb) and all(x == y or x == "<*>" or y == "<*>" for x, y in zip(sa, sb))


DOCS_CONFIG_NORM = {norm_path(k): k for k in DOCS_CONFIG}

# --------------------------------------------------------------------------------------
# Config schema walk
# --------------------------------------------------------------------------------------
SCHEMA_REL = "codex-rs/core/config.schema.json"
SCHEMA = json.loads((SRC / SCHEMA_REL).read_text())
DEFS = SCHEMA["definitions"]
PLACEHOLDER = {
    "model_providers": "<id>", "mcp_servers": "<id>", "profiles": "<name>", "projects": "<path>",
    "permissions": "<name>", "apps": "<id>", "plugins": "<plugin>", "marketplaces": "<name>",
    "tools": "<tool>", "agents": "<role>", "skills": "<name>",
    "origins": "<pattern>", "bundle_ids": "<bundle-id>", "aumids": "<aumid>", "env": "<VAR>",
    "http_headers": "<header>", "env_http_headers": "<header>", "domains": "<domain>",
    "unix_sockets": "<path>", "keymap": "<action>",
}


def deref(n: dict, seen=None) -> tuple[dict, str | None]:
    """Resolve $ref / single allOf / Option-style anyOf. Returns (node, definition name)."""
    defname = None
    for _ in range(12):
        if "$ref" in n:
            defname = n["$ref"].split("/")[-1]
            n = {**DEFS[defname], **{k: v for k, v in n.items() if k != "$ref"}}
            continue
        if "allOf" in n and len(n["allOf"]) == 1:
            inner, dn = deref(n["allOf"][0])
            defname = dn or defname
            n = {**inner, **{k: v for k, v in n.items() if k != "allOf"}}
            continue
        for alt_key in ("anyOf", "oneOf"):
            alts = n.get(alt_key)
            if alts:
                non_null = [a for a in alts if a.get("type") != "null"]
                if len(non_null) == 1 and len(non_null) != len(alts):
                    inner, dn = deref(non_null[0])
                    defname = dn or defname
                    n = {**inner, **{k: v for k, v in n.items() if k != alt_key}}
                    break
        else:
            break
    return n, defname


def type_str(n: dict, depth: int = 0) -> str:
    n, _ = deref(n)
    if depth > 4:
        return "…"
    if "const" in n:
        return json.dumps(n["const"])
    if "enum" in n:
        vals = [v for v in n["enum"] if v is not None]
        return " | ".join(json.dumps(v) for v in vals)
    alts = n.get("oneOf") or n.get("anyOf")
    if alts:
        parts = []
        for a in alts:
            s = type_str(a, depth + 1)
            if s != "null" and s not in parts:
                parts.append(s)
        return " | ".join(parts)
    t = n.get("type")
    if isinstance(t, list):
        t = [x for x in t if x != "null"]
        t = t[0] if len(t) == 1 else " | ".join(t)
    if t == "array":
        it = n.get("items")
        return f"array<{type_str(it, depth + 1)}>" if isinstance(it, dict) else "array"
    if t == "object" or "properties" in n or "additionalProperties" in n:
        if n.get("properties"):
            return "table"
        ap = n.get("additionalProperties")
        if isinstance(ap, dict):
            return f"map<string, {type_str(ap, depth + 1)}>"
        return "table"
    if t == "integer":
        fmt = n.get("format")
        return f"integer ({fmt})" if fmt else "integer"
    return t or "any"


def enum_values(n: dict) -> list[dict]:
    n, _ = deref(n)
    vals = []
    if "enum" in n:
        vals = [{"value": v} for v in n["enum"] if v is not None]
    for a in n.get("oneOf") or n.get("anyOf") or []:
        a2, _ = deref(a)
        if "enum" in a2:
            for v in a2["enum"]:
                if v is not None:
                    vals.append({"value": v, "description": short(a2.get("description") or a.get("description"), 240)})
        elif "const" in a2:
            vals.append({"value": a2["const"], "description": short(a2.get("description"), 240)})
        elif a2.get("type") == "object" and a2.get("properties") and len(a2.get("required", [])) == 1:
            vals.append({"value": f"{{ {a2['required'][0]} = … }}", "description": short(a2.get("description"), 240)})
    return vals


SCHEMA_NODES: list[dict] = []  # flat list of walked config paths
HOOK_EVENTS: list[str] = []


def children(resolved: dict, owner: str | None, path: str):
    """Yield (suffix, child node, owner definition, field name) for everything nested in a node."""
    for k, v in (resolved.get("properties") or {}).items():
        yield f".{k}", v, owner, k
    ap = resolved.get("additionalProperties")
    if isinstance(ap, dict):
        leaf = re.split(r"[.\[\]]+", path.rstrip("[]"))[-1] if path else ""
        yield f".{PLACEHOLDER.get(leaf, '<key>')}", ap, owner, None
    tags = []
    for alt in resolved.get("oneOf") or resolved.get("anyOf") or []:
        a2, adn = deref(alt)
        for k, v in (a2.get("properties") or {}).items():
            vv, _ = deref(v)
            if k == "type" and vv.get("enum") and len(vv["enum"]) == 1:
                tags.append({"enum": vv["enum"], "type": "string", "description": a2.get("description")})
                continue
            yield f".{k}", v, adn or owner, k
    if tags:
        yield ".type", {"oneOf": tags}, owner, "type"
    if resolved.get("type") == "array" and isinstance(resolved.get("items"), dict):
        it, idn = deref(resolved["items"])
        for suffix, v, o, f in children(it, idn or owner, path + "[]"):
            yield "[]" + suffix, v, o, f


def walk(node: dict, path: str, owner: str | None, field: str | None, stack: tuple):
    resolved, defname = deref(node)
    desc = node.get("description") or resolved.get("description")
    SCHEMA_NODES.append({
        "path": path, "node": resolved, "raw": node, "owner": owner, "field": field,
        "description": desc, "defname": defname,
    })
    if path == "profiles":
        # Collapsed: profile tables accept the ConfigProfile keys, recorded on the profiles items.
        return
    if defname and defname in stack:
        return
    st = stack + ((defname,) if defname else ())
    if path == "hooks":
        # Every lifecycle event takes the same matcher-group array; list it once as hooks.<Event>.
        events = [k for k, v in (resolved.get("properties") or {}).items()
                  if deref(v)[0].get("type") == "array" and deref(deref(v)[0].get("items", {}))[1] == "MatcherGroup"]
        HOOK_EVENTS.extend(events)
        if events:
            walk(resolved["properties"][events[0]], "hooks.<Event>", defname or owner, None, st)
        resolved = {**resolved, "properties": {k: v for k, v in resolved["properties"].items() if k not in events}}
    for suffix, child, child_owner, child_field in children(resolved, defname or owner, path):
        cn, cdn = deref(child)
        if cdn and cdn in st:
            continue
        walk(child, path + suffix, child_owner, child_field, st)


for k, v in SCHEMA["properties"].items():
    walk(v, k, "ConfigToml", k, ())

# Deduplicate (a path can be reached through several anyOf branches).
_seen = {}
for n in SCHEMA_NODES:
    _seen.setdefault(n["path"], n)
SCHEMA_NODES = list(_seen.values())
SCHEMA_PATHS = {n["path"] for n in SCHEMA_NODES}
SCHEMA_NORM = {norm_path(p): p for p in SCHEMA_PATHS}

# --------------------------------------------------------------------------------------
# Defaults
# --------------------------------------------------------------------------------------
DEFAULTS_REL = "codex-rs/config/defaults.toml"
PACKAGED_DEFAULTS = {}
_section = ""
for i, ln in enumerate((SRC / DEFAULTS_REL).read_text().splitlines(), 1):
    s = ln.strip()
    if not s or s.startswith("#"):
        continue
    m = re.match(r"^\[(.+)\]$", s)
    if m:
        _section = m.group(1) + "."
        continue
    k, _, v = s.partition("=")
    PACKAGED_DEFAULTS[_section + k.strip()] = (v.strip(), i)

DEFAULT_TEXT_RE = re.compile(r"\b(?:[Dd]efaults? (?:to|is)|\(default:?)\s*[:`]?\s*([^.;)\n]{1,80})")


def default_claims(path: str, schema_node: dict | None, comment: str | None, docs_desc: str | None, src_ref) -> list[dict]:
    claims = []
    if path in PACKAGED_DEFAULTS:
        v, line = PACKAGED_DEFAULTS[path]
        claims.append({"value": v, "source": f"codex-rs@{TAG}:{DEFAULTS_REL}:{line}",
                       "note": "embedded packaged-defaults layer (lowest-precedence config layer, include_str! in codex-rs/config/src/loader/mod.rs)"})
    if schema_node is not None and "default" in schema_node and schema_node["default"] is not None:
        claims.append({"value": json.dumps(schema_node["default"]), "source": f"codex-rs@{TAG}:{SCHEMA_REL}", "note": "schema default"})
    if docs_desc:
        m = DEFAULT_TEXT_RE.search(docs_desc)
        if m:
            claims.append({"value": m.group(1).strip(" `"), "source": CONFIG_REF_URL, "note": "stated in docs"})
    if comment:
        m = DEFAULT_TEXT_RE.search(comment)
        if m:
            claims.append({"value": m.group(1).strip(" `"), "source": src_ref, "note": "stated in source doc comment"})
    return claims


# --------------------------------------------------------------------------------------
# Feature registry
# --------------------------------------------------------------------------------------
FEAT_REL = "codex-rs/features/src/lib.rs"
FEAT_LINES = (SRC / FEAT_REL).read_text().splitlines()
FEAT_TEXT = "\n".join(FEAT_LINES)


def line_of(offset: int, text: str = FEAT_TEXT) -> int:
    return text.count("\n", 0, offset) + 1


variant_docs = {}
m = re.search(r"pub enum Feature \{(.*?)\n\}", FEAT_TEXT, re.S)
_doc = []
for ln in m.group(1).splitlines():
    s = ln.strip()
    if s.startswith("///"):
        _doc.append(s[3:].strip())
    elif re.match(r"^\w+,$", s):
        variant_docs[s[:-1]] = " ".join(_doc) or None
        _doc = []
    elif s.startswith("//"):
        continue
    else:
        _doc = []

REGISTRY = []
fstart = FEAT_TEXT.index("pub const FEATURES")
for fm in re.finditer(r"FeatureSpec \{(.*?)\n    \},", FEAT_TEXT[fstart:], re.S):
    body = fm.group(1)
    fid = re.search(r"id: Feature::(\w+)", body).group(1)
    key = re.search(r'key: "([^"]+)"', body).group(1)
    # Some specs pick the stage with a cfg!() conditional; take the first Stage:: named.
    stage = re.search(r"stage:.*?Stage::(\w+)", body, re.S).group(1)
    dflt = re.search(r"default_enabled: (.+?),\s*$", body, re.M).group(1).strip()
    exp = {}
    if stage == "Experimental":
        for f in ("name", "menu_description", "announcement"):
            mm = re.search(rf'{f}:\s*"((?:[^"\\]|\\.)*)"', body)
            exp[f] = mm.group(1) if mm else None
    REGISTRY.append({"id": fid, "key": key, "stage": stage, "default_expr": dflt, "experimental": exp,
                     "line": line_of(fstart + fm.start()), "doc": variant_docs.get(fid)})

LEGACY_REL = "codex-rs/features/src/legacy.rs"
LEGACY_TEXT = (SRC / LEGACY_REL).read_text()
LEGACY_ALIASES = [(mm.group(1), mm.group(2), line_of(mm.start(), LEGACY_TEXT))
                  for mm in re.finditer(r'legacy_key: "([^"]+)",\s*feature: Feature::(\w+)', LEGACY_TEXT)]
FEATURES_LIST = load_features_list()
STAGE_WORDS = {"UnderDevelopment": "under development", "Experimental": "experimental", "Stable": "stable",
               "Deprecated": "deprecated", "Removed": "removed"}

# --------------------------------------------------------------------------------------
# Config grouping
# --------------------------------------------------------------------------------------
CONFIG_GROUPS = [
    ("Model and provider selection", r"^(model|review_model|model_provider|model_providers|openai_base_url|chatgpt_base_url|oss_provider|model_context_window|model_auto_compact_token_limit|model_auto_compact_token_limit_scope|model_catalog_json|model_reasoning_effort|model_reasoning_summary|model_verbosity|plan_mode_reasoning_effort|service_tier|personality|responses_api_metadata)(\.|$)"),
    ("Instructions and prompt assembly", r"^(instructions|developer_instructions|model_instructions_file|compact_prompt|experimental_compact_prompt_file|include_apps_instructions|include_collaboration_mode_instructions|include_environment_context|include_permissions_instructions|project_doc_max_bytes|project_doc_fallback_filenames|project_root_markers)(\.|$)"),
    ("Sandbox, permissions and approvals", r"^(approval_policy|approvals_reviewer|auto_review|sandbox_mode|sandbox_workspace_write|default_permissions|permissions|allow_login_shell|shell_environment_policy|windows)(\.|$)"),
    ("MCP servers", r"^(mcp_servers|mcp_enterprise_managed_auth|mcp_oauth_callback_port|mcp_oauth_callback_url|mcp_oauth_credentials_store|mcp_optional_startup_grace_ms)(\.|$)"),
    ("Feature flags", r"^features(\.|$)"),
    ("Tools, web search, browser and computer use", r"^(tools|web_search|tool_output_token_limit|tool_suggest|background_terminal_max_timeout|experimental_use_unified_exec_tool|browser_use|computer_use)(\.|$)"),
    ("Agents, skills, plugins and apps", r"^(agents|memories|goals|orchestrator|skills|plugins|marketplaces|apps|apps_mcp_product_sku)(\.|$)"),
    ("Hooks and notifications", r"^(hooks|notify)(\.|$)"),
    ("Profiles and projects", r"^(profile|profiles|projects)(\.|$)"),
    ("Authentication and login", r"^(cli_auth_credentials_store|forced_login_method|forced_chatgpt_workspace_id)(\.|$)"),
    ("Realtime voice and audio", r"^(realtime|audio|experimental_realtime_\w+)(\.|$)"),
    ("Telemetry, history and storage", r"^(otel|analytics|feedback|history|log_dir|sqlite_home|experimental_thread_store|thread_unload_delay_secs|ghost_snapshot|check_for_update_on_startup|allow_symlinked_codex_home)(\.|$)"),
    ("Desktop and terminal UI", r"^(tui|desktop|file_opener|hide_agent_reasoning|show_raw_agent_reasoning|disable_paste_burst|notice|suppress_unstable_features_warning)(\.|$)"),
]
KEYMAP_GROUP = "Terminal UI keymap"
HIDDEN_GROUP = "Hidden, legacy and alias keys (not in the generated schema)"
DOCS_ONLY_GROUP = "Documented but not accepted by this build"
REQ_GROUP = "Managed requirements (requirements.toml)"


def group_for(path: str) -> str:
    if path.startswith("tui.keymap"):
        return KEYMAP_GROUP
    for name, rx in CONFIG_GROUPS:
        if re.match(rx, path):
            return name
    return "Other settings"


def when_for(path: str) -> str | None:
    if path.startswith("windows.") or path == "windows" or ".windows" in path:
        return "Windows only"
    if ".macos" in path:
        return "macOS only"
    m = re.match(r"^features\.([a-z0-9_]+)\.", path)
    if m:
        return f"read when features.{m.group(1)} is enabled"
    if path.startswith("notice."):
        return "internal state written by Codex/ChatGPT"
    return None


def docs_lookup(path: str):
    n = norm_path(path)
    k = DOCS_CONFIG_NORM.get(n)
    if k is None:
        k = next((dk for dk in DOCS_CONFIG if seg_match(dk, path)), None)
    if k is not None:
        return {"key": k, **DOCS_CONFIG[k], "url": CONFIG_REF_URL}
    return None


def other_doc_mentions(token: str) -> list[str]:
    if "<" in token or "[" in token or len(token) < 4:
        return []
    return mentioned_in_code(token, "config-file/config-reference", bare_word="." not in token and "_" not in token)


PROFILE_KEYS = sorted((DEFS["ConfigProfile"].get("properties") or {}).keys())

config_items: list[dict] = []


def make_config_item(path: str, group: str, *, typ, values, default, description, status, documented,
                     provenance, details_extra=None, when=None):
    item = {
        "id": "config:" + path,
        "title": path,
        "group": group,
        "kind": "setting",
        "text": None,
        "when": when,
        "documented": documented,
        "details": {
            "path": path,
            "type": typ,
            "values": values or None,
            "default": default,
            "description": description,
            "status": status,
            **(details_extra or {}),
        },
        "provenance": provenance,
    }
    config_items.append(item)
    return item


feature_keys = {r["key"] for r in REGISTRY}

for n in SCHEMA_NODES:
    path = n["path"]
    if path.startswith("features.") and path[len("features."):] in feature_keys:
        continue  # emitted from the feature registry below
    loc = find_field(n["owner"], n["field"]) if n["owner"] and n["field"] else (find_def(n["owner"])[:2] if n["owner"] and find_def(n["owner"]) else None)
    prov = []
    if loc:
        prov.append(src_prov(loc[0], loc[1], f"{n['owner']}.{n['field']}" if n["field"] else n["owner"]))
    prov.append({"source": f"codex-rs@{TAG}:{SCHEMA_REL}", "note": "generated ConfigToml JSON Schema (codex-rs/config-schema)"})
    leaf = [seg for seg in re.split(r"[.\[\]]+", path) if seg and not seg.startswith("<")]
    token = leaf[-1] if leaf else path
    bp = binary_presence(token)
    if bp["present"]:
        prov.append({"source": BIN_PROV, "note": f"key string `{token}` present in binary ({bp['strength']} match)"})
    d = docs_lookup(path)
    mentions = other_doc_mentions(path) if not d else []
    documented = bool(d or mentions)
    comment = n["description"]
    src_ref = prov[0]["source"]
    if d:
        description = {"text": short(d["description"]), "source": d["url"]}
    elif comment:
        description = {"text": short(comment), "source": src_ref if loc else f"codex-rs@{TAG}:{SCHEMA_REL}"}
    else:
        description = None
    claims = default_claims(path, n["raw"] if "default" in n["raw"] else n["node"], comment, d["description"] if d else None, src_ref)
    top = path.split(".")[0].split("[")[0]
    extra = {
        "source_comment": short(comment) if comment and d else None,
        "docs_type": d["type"] if d else None,
        "docs_urls": ([d["url"]] if d else []) + mentions,
        "default_claims": claims,
        "profile_overridable": (top in PROFILE_KEYS) if "." not in path else None,
        "binary": bp,
    }
    if path == "profiles":
        extra["profile_keys"] = PROFILE_KEYS
    if path == "hooks.<Event>":
        extra["events"] = HOOK_EVENTS
    if n["node"].get("deprecated") or (comment and re.match(r"^(Deprecated|Legacy|Removed)\b", comment)):
        status = "deprecated or legacy (per source comment)"
    elif path.startswith("notice."):
        status = "internal state"
    else:
        status = "documented" if documented else "undocumented"
    make_config_item(
        path, group_for(path), typ=type_str(n["node"]), values=enum_values(n["node"]),
        default=claims[0]["value"] if claims else None, description=description, status=status,
        documented=documented, provenance=prov, details_extra=extra, when=when_for(path),
    )

# Profiles: add the collapsed per-profile item.
_prof_def = find_def("ConfigProfile")
make_config_item(
    "profiles.<name>", "Profiles and projects", typ="table", values=None, default=None,
    description={"text": "A named profile. Accepts the keys listed in details.profile_keys; each overrides the top-level key of the same name when the profile is active (`profile = \"<name>\"` or `--profile`).",
                 "source": f"codex-rs@{TAG}:{_prof_def[0]}:{_prof_def[1]}"},
    status="documented" if docs_lookup("profiles.<name>.model") else "undocumented",
    documented=bool(docs_lookup("profiles.<name>.model")),
    provenance=[src_prov(_prof_def[0], _prof_def[1], "struct ConfigProfile"),
                {"source": f"codex-rs@{TAG}:{SCHEMA_REL}", "note": "definitions.ConfigProfile"}],
    details_extra={"profile_keys": PROFILE_KEYS, "docs_urls": [CONFIG_REF_URL] if docs_lookup("profiles.<name>.model") else [],
                   "binary": None, "default_claims": []},
)

# Feature flags from the registry, merged with the schema and the binary's own list.
schema_feature_props = set((DEFS.get("FeaturesToml") or deref(SCHEMA["properties"]["features"])[0]).get("properties", {}).keys())
alias_by_feature = collections.defaultdict(list)
for legacy, fid, line in LEGACY_ALIASES:
    alias_by_feature[fid].append((legacy, line))
for r in REGISTRY:
    path = f"features.{r['key']}"
    fl = FEATURES_LIST.get(r["key"])
    schema_node = deref(SCHEMA["properties"]["features"])[0]["properties"].get(r["key"])
    prov = [src_prov(FEAT_REL, r["line"], f"FeatureSpec Feature::{r['id']}")]
    if fl:
        prov.append({"source": BIN_PROV, "note": f"`codex features list` (empty CODEX_HOME): stage={fl['stage']}, enabled={str(fl['enabled']).lower()}"})
    d = docs_lookup(path)
    mentions = other_doc_mentions(path) if not d else []
    documented = bool(d or mentions)
    stage_word = STAGE_WORDS[r["stage"]]
    desc_text = d["description"] if d else (r["experimental"].get("menu_description") or r["doc"])
    desc_src = CONFIG_REF_URL if d else prov[0]["source"]
    mismatch = []
    if fl and fl["stage"] != stage_word:
        mismatch.append(f"binary reports stage '{fl['stage']}'")
    if schema_node is None:
        mismatch.append("not listed in generated schema (accepted via the flattened boolean map)")
    if not fl:
        mismatch.append("not reported by `codex features list`")
    dflt_is_literal = r["default_expr"] in ("true", "false")
    make_config_item(
        path, "Feature flags", typ=type_str(schema_node) if schema_node else "boolean",
        values=None,
        default=r["default_expr"] if dflt_is_literal else f"`{r['default_expr']}`",
        description={"text": short(desc_text), "source": desc_src} if desc_text else None,
        status=("removed (accepted, no effect)" if r["stage"] == "Removed" else ("documented" if documented else "undocumented")),
        documented=documented,
        provenance=prov,
        when=None,
        details_extra={
            "feature_id": r["id"],
            "stage": stage_word,
            "default_expr": r["default_expr"],
            "enabled_on_this_build_with_empty_config": fl["enabled"] if fl else None,
            "experimental_menu": r["experimental"] or None,
            "source_comment": short(r["doc"]),
            "legacy_aliases": [a for a, _ in alias_by_feature.get(r["id"], [])] or None,
            "docs_urls": ([d["url"]] if d else []) + mentions,
            "docs_type": d["type"] if d else None,
            "binary": binary_presence(r["key"]),
            "consistency_notes": mismatch or None,
            "default_claims": [{"value": r["default_expr"], "source": prov[0]["source"], "note": "FeatureSpec.default_enabled"}],
        },
    )
extra_binary_features = sorted(set(FEATURES_LIST) - feature_keys)

# --------------------------------------------------------------------------------------
# Hidden keys: schemars(skip) fields, serde aliases, config key aliases, legacy feature aliases
# --------------------------------------------------------------------------------------
def def_paths(defname: str) -> list[str]:
    """Schema paths whose node is the given definition (so its fields live beneath them)."""
    out = [n["path"] for n in SCHEMA_NODES if n["defname"] == defname]
    if defname == "ConfigToml":
        out = [""]
    return out


def enclosing_def(rel: str, line: int):
    lines = RS_FILES[rel]
    for j in range(line - 1, -1, -1):
        m = re.match(r"^\s*pub(?:\([^)]*\))?\s+(struct|enum)\s+(\w+)", lines[j])
        if m:
            return m.group(2), m.group(1)
    return None, None


hidden_seen = set()
CONFIG_SRC_DIRS = ("codex-rs/config/src/", "codex-rs/features/src/")
for rel, lines in RS_FILES.items():
    if not rel.startswith(CONFIG_SRC_DIRS):
        continue
    for i, ln in enumerate(lines):
        is_skip = "schemars(skip)" in ln
        alias_m = re.search(r'serde\(alias = "([^"]+)"\)', ln)
        if not (is_skip or alias_m):
            continue
        # Look back for serde(skip): not deserialized at all, so not a config key.
        attr_block = " ".join(lines[max(0, i - 3): i + 1])
        if is_skip and re.search(r"serde\(skip\)", attr_block):
            continue
        j = i + 1
        while j < len(lines) and lines[j].strip().startswith("#["):
            j += 1
        fm = re.match(r"^\s*(?:pub(?:\([^)]*\))?\s+)?(\w+)\s*:", lines[j])
        vm = re.match(r"^\s*(\w+)\s*[{(,]", lines[j])
        rename = re.search(r'rename = "([^"]+)"', " ".join(lines[i - 2: j + 1]))
        defname, kind = enclosing_def(rel, j + 1)
        if not defname:
            continue
        parents = def_paths(defname)
        if defname == "FeaturesToml":
            parents = ["features"]
        if defname == "ConfigProfile":
            parents = ["profiles.<name>"]
        comment = doc_comment_above(rel, j + 1)
        for parent in parents or ["?"]:
            if fm and kind == "struct":
                field = rename.group(1) if rename else fm.group(1)
                if alias_m:
                    path = f"{parent}.{alias_m.group(1)}" if parent else alias_m.group(1)
                    canonical = f"{parent}.{field}" if parent else field
                    status, desc = "alias", f"Legacy alias for `{canonical}`."
                else:
                    path = f"{parent}.{field}" if parent else field
                    canonical, status, desc = None, "hidden (schemars(skip))", None
            elif vm and kind == "enum":
                variant = re.sub(r"(?<!^)(?=[A-Z])", "_", vm.group(1)).lower()
                path = f"{parent}.type = \"{variant}\"" if parent else variant
                canonical, status, desc = None, "hidden enum variant (schemars(skip))", None
            else:
                continue
            if path in hidden_seen or path in SCHEMA_PATHS:
                continue
            hidden_seen.add(path)
            token = path.split(".")[-1].split(" ")[0]
            bp = binary_presence(token)
            prov = [src_prov(rel, j + 1, f"{defname}")]
            if bp["present"]:
                prov.append({"source": BIN_PROV, "note": f"key string `{token}` present in binary ({bp['strength']} match)"})
            probe = PROBES.get(path)
            if probe:
                prov.append({"source": BIN_PROV, "note": f"--strict-config probe: {probe['result']}"})
            make_config_item(
                path, HIDDEN_GROUP, typ=None, values=None, default=None,
                description={"text": short(desc or comment), "source": prov[0]["source"]} if (desc or comment) else None,
                status=status, documented=bool(docs_lookup(path)), provenance=prov, when=when_for(path),
                details_extra={"canonical": canonical, "source_comment": short(comment), "binary": bp,
                               "strict_config_probe": probe, "default_claims": [],
                               "docs_urls": [CONFIG_REF_URL] if docs_lookup(path) else []},
            )

# Config key aliases normalized before deserialization.
KA_REL = "codex-rs/config/src/key_aliases.rs"
KA_TEXT = (SRC / KA_REL).read_text()
for mm in re.finditer(r'table_path: &\[([^\]]*)\],\s*legacy_key: "([^"]+)",\s*canonical_key: "([^"]+)"', KA_TEXT):
    table = ".".join(re.findall(r'"([^"]+)"', mm.group(1)))
    path = f"{table}.{mm.group(2)}"
    if path in hidden_seen:
        for it in config_items:
            if it["title"] == path:
                it["provenance"].append(src_prov(KA_REL, line_of(mm.start(), KA_TEXT), "CONFIG_KEY_ALIASES"))
        continue
    hidden_seen.add(path)
    make_config_item(path, HIDDEN_GROUP, typ=None, values=None, default=None,
                     description={"text": f"Legacy alias for `{table}.{mm.group(3)}`.", "source": src_prov(KA_REL, line_of(mm.start(), KA_TEXT))["source"]},
                     status="alias", documented=False,
                     provenance=[src_prov(KA_REL, line_of(mm.start(), KA_TEXT), "CONFIG_KEY_ALIASES")],
                     details_extra={"canonical": f"{table}.{mm.group(3)}", "binary": binary_presence(mm.group(2)),
                                    "strict_config_probe": PROBES.get(path), "docs_urls": [], "default_claims": []})

reg_by_id = {r["id"]: r for r in REGISTRY}
for legacy, fid, line in LEGACY_ALIASES:
    path = f"features.{legacy}"
    if legacy in feature_keys:
        continue
    probe = PROBES.get(path)
    prov = [src_prov(LEGACY_REL, line, "legacy feature alias")]
    existing = next((it for it in config_items if it["title"] == path), None)
    if existing:
        # The schema lists some legacy names too; label that item instead of duplicating it.
        existing["details"]["status"] = "alias"
        existing["details"]["canonical"] = f"features.{reg_by_id[fid]['key']}"
        existing["provenance"].insert(0, prov[0])
        if not existing["details"].get("description"):
            existing["details"]["description"] = {"text": f"Legacy alias for `features.{reg_by_id[fid]['key']}`.", "source": prov[0]["source"]}
        continue
    if probe:
        prov.append({"source": BIN_PROV, "note": f"--strict-config probe: {probe['result']}"})
    make_config_item(path, HIDDEN_GROUP, typ="boolean", values=None, default=None,
                     description={"text": f"Legacy alias for `features.{reg_by_id[fid]['key']}`; a deprecation notice is logged when used.", "source": prov[0]["source"]},
                     status="alias", documented=bool(docs_lookup(path)), provenance=prov,
                     details_extra={"canonical": f"features.{reg_by_id[fid]['key']}", "binary": binary_presence(legacy),
                                    "strict_config_probe": probe, "docs_urls": [], "default_claims": []})

# Documented keys the schema does not have: check the source and the binary before labeling.
docs_only = []
for k in DOCS_CONFIG:
    if k.startswith("profiles.") or k in hidden_seen or k == "features.<name>":
        continue
    if re.match(r"^features\.[^.]+$", k) and k.split(".")[1] in feature_keys:
        continue
    if norm_path(k) in SCHEMA_NORM or any(seg_match(k, p) for p in SCHEMA_PATHS):
        continue
    docs_only.append(k)

OPAQUE = {n["path"] for n in SCHEMA_NODES
          if n["node"].get("type") == "object" and not n["node"].get("properties")
          and not isinstance(n["node"].get("additionalProperties"), dict) and not n["node"].get("oneOf") and not n["node"].get("anyOf")}
CONFIG_SRC_PREFIXES = ("codex-rs/config/src/", "codex-rs/features/src/", "codex-rs/protocol/src/", "codex-rs/core/src/config",
                       "codex-rs/model-provider-info/src/", "codex-rs/otel/src/")


def field_in_config_sources(token: str):
    rx = re.compile(rf'^\s*(?:pub(?:\([^)]*\))?\s+)?(?:r#)?{re.escape(token.replace("-", "_"))}\s*:|rename\s*=\s*"{re.escape(token)}"')
    for rel, lines in RS_FILES.items():
        if rel.startswith(CONFIG_SRC_PREFIXES):
            for i, ln in enumerate(lines):
                if rx.search(ln):
                    return rel, i + 1
    return None


for k in docs_only:
    token = [seg for seg in re.split(r"[.\[\]]+", k) if seg and not seg.startswith("<")][-1].strip('"')
    loc = field_in_config_sources(token)
    opaque_parent = next((p for p in sorted(OPAQUE, key=len, reverse=True) if k.startswith(p + ".")), None)
    bp = binary_presence(token)
    probe = PROBES.get(k)
    if probe and opaque_parent and probe["accepted"]:
        probe = {**probe, "accepted": None,
                 "result": f"inconclusive: `{opaque_parent}` is an opaque table in this build, so any key loads"}
    prov = [{"source": CONFIG_REF_URL, "note": "listed in the config.toml reference table"}]
    if loc:
        prov.append(src_prov(loc[0], loc[1], f"field `{token}` in config sources"))
    prov.append({"source": f"codex-rs@{TAG}:{SCHEMA_REL}",
                 "note": f"schema types `{opaque_parent}` as an opaque table" if opaque_parent else "absent from the generated schema at this tag"})
    if bp["present"]:
        prov.append({"source": BIN_PROV, "note": f"key string `{token}` present in binary ({bp['strength']} match)"})
    if probe:
        prov.append({"source": BIN_PROV, "note": f"--strict-config probe: {probe['result']}"})
    desktop_hits = []
    if opaque_parent == "desktop":
        # The CLI keeps [desktop] opaque; the Electron app is what reads these keys.
        desktop_hits = [f for f, pth in ASAR_JS.items() if token in pth.read_text(errors="replace")]
        for f in desktop_hits:
            prov.append({"source": f"app.asar:.vite/build/{f}", "note": f"key string `{token}` present in desktop bundle"})
    if probe and probe["accepted"] is not None:
        accepted = probe["accepted"] or probe["result"].startswith("parsed")
    else:
        accepted = bool(opaque_parent and (loc or bp["present"] or desktop_hits or opaque_parent == "desktop"))
    if opaque_parent == "desktop":
        status = "documented; CLI schema leaves `desktop` opaque (read by the desktop app)"
    elif opaque_parent:
        status = f"documented; schema leaves `{opaque_parent}` opaque" + ("; field found in config sources" if loc else "")
    elif accepted:
        status = "documented; accepted by this binary but absent from its schema"
    elif probe:
        status = "documented; rejected by this binary's config parser (--strict-config probe)"
    else:
        status = "documented; not in this build's schema (unverified)"
    make_config_item(
        k, group_for(k) if accepted else DOCS_ONLY_GROUP, typ=DOCS_CONFIG[k]["type"], values=None, default=None,
        description={"text": short(DOCS_CONFIG[k]["description"]), "source": CONFIG_REF_URL},
        status=status, documented=True, provenance=prov, when=when_for(k),
        details_extra={"docs_urls": [CONFIG_REF_URL], "docs_type": DOCS_CONFIG[k]["type"],
                       "config_source_field": f"codex-rs@{TAG}:{loc[0]}:{loc[1]}" if loc else None,
                       "binary": bp, "strict_config_probe": probe, "default_claims": []},
    )

# Attach any probe results to schema items too.
for it in config_items:
    p = PROBES.get(it["title"])
    if p and "strict_config_probe" not in it["details"]:
        it["details"]["strict_config_probe"] = p
        it["provenance"].append({"source": BIN_PROV, "note": f"--strict-config probe: {p['result']}"})

# requirements.toml keys, from the docs table (managed-admin file; not config.toml).
REQ_REL = "codex-rs/config/src/config_requirements.rs"
for k, v in DOCS_REQUIREMENTS.items():
    token = [seg for seg in re.split(r"[.\[\]]+", k) if seg and not seg.startswith("<")][-1]
    loc = None
    for rel in ("codex-rs/config/src/config_requirements.rs", "codex-rs/config/src/application_requirements.rs",
                "codex-rs/config/src/mcp_requirements.rs", "codex-rs/config/src/model_provider_requirements.rs",
                "codex-rs/config/src/requirements_exec_policy.rs", "codex-rs/config/src/browser_computer_use_requirements.rs",
                "codex-rs/config/src/in_app_browser_requirements.rs", "codex-rs/config/src/filesystem_constraints.rs"):
        for i, ln in enumerate(RS_FILES.get(rel, [])):
            if re.match(rf"^\s*(?:pub(?:\([^)]*\))?\s+)?{re.escape(token)}\s*:", ln):
                loc = (rel, i + 1)
                break
        if loc:
            break
    prov = [{"source": CONFIG_REF_URL, "note": "requirements.toml reference table"}]
    if loc:
        prov.append(src_prov(loc[0], loc[1]))
    bp = binary_presence(token)
    if bp["present"]:
        prov.append({"source": BIN_PROV, "note": f"key string `{token}` present in binary ({bp['strength']} match)"})
    make_config_item(
        "requirements:" + k, REQ_GROUP, typ=v["type"], values=None, default=None,
        description={"text": short(v["description"]), "source": CONFIG_REF_URL}, status="documented (requirements.toml)",
        documented=True, provenance=prov, when="requirements.toml (admin-managed), not config.toml",
        details_extra={"docs_urls": [CONFIG_REF_URL], "docs_type": v["type"], "binary": bp, "default_claims": [],
                       "file": "requirements.toml"},
    )
    config_items[-1]["title"] = k
    config_items[-1]["details"]["path"] = k

# --------------------------------------------------------------------------------------
# Environment variables
# --------------------------------------------------------------------------------------
CONSTS: dict[str, set] = collections.defaultdict(set)
CONST_LOC: dict[str, tuple] = {}
for rel, lines in RS_FILES.items():
    for i, ln in enumerate(lines):
        m = re.match(r'^\s*(?:pub(?:\([^)]*\))?\s+)?(?:const|static)\s+([A-Z][A-Z0-9_]*)\s*:\s*&(?:\'static\s+)?str\s*=\s*"([^"]*)"\s*;', ln)
        if m:
            CONSTS[m.group(1)].add(m.group(2))
            CONST_LOC.setdefault((m.group(1), m.group(2)), (rel, i + 1))

READ_HELPERS = ("var_non_empty|non_empty_env_var|non_empty_env_var_from|env_var_present|env_value|required_env|"
                "optional_environment_value|get_env|env_present|read_non_empty_env_var|read_timeout_env|environment_variable")
ARG = r'(?:&)?(?:"([A-Za-z_][A-Za-z0-9_]*)"|((?:[a-z_][a-z0-9_]*::)*[A-Z][A-Z0-9_]{2,}))'
READ_RE = re.compile(rf"(?:\benv::(var_os|var)|\b({READ_HELPERS}))\s*\(\s*{ARG}\s*[,)]")
SET_RE = re.compile(rf"(?:\.(env|env_remove)|\b(?:env::)?(set_var|remove_var))\s*\(\s*{ARG}\s*[,)]")
CLAP_RE = re.compile(r'\benv\s*=\s*"([A-Z][A-Z0-9_]+)"')
BUILD_RE = re.compile(r'\b(option_env|env)!\(\s*"([A-Z][A-Z0-9_]+)"')
ENV_KEY_RE = re.compile(r'env_key:\s*Some\(\s*"([A-Z][A-Z0-9_]+)"')


def resolve_arg(lit, const):
    if lit:
        return [lit]
    name = const.split("::")[-1]
    return sorted(CONSTS.get(name, []))


def enclosing_fn(rel: str, line: int) -> str | None:
    lines = RS_FILES.get(rel, [])
    for j in range(line - 1, max(-1, line - 400), -1):
        m = re.match(r"^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:const\s+)?(?:unsafe\s+)?fn\s+(\w+)", lines[j])
        if m:
            return m.group(1)
        if re.match(r"^(?:impl|mod|pub mod|struct|pub struct|enum|pub enum)\b", lines[j]):
            return None
    return None


def statement(lines: list[str], line: int) -> str:
    """The source statement starting at `line`: up to the first `;` (at most 6 lines)."""
    out = []
    for ln in lines[line - 1: line + 5]:
        out.append(ln)
        if ";" in ln:
            break
    return "\n".join(out)


def classify_read(ctx: str, name: str, helper: str) -> tuple[str, str]:
    if helper in ("env_var_present", "env_present"):
        return "presence (set/unset)", "code"
    first = ctx.splitlines()[0] if ctx else ""
    if re.search(r'==\s*(?:Ok|Some)\("(?:1|true)"\)', first):
        return "boolean", "code"
    if re.search(r'==\s*(?:Ok|Some)\("[^"]+"\)', first):
        return "string (compared to a fixed value)", "code"
    if re.search(r"parse::<\s*(?:u|i)(?:8|16|32|64|128|size)\s*>|parse::<f(?:32|64)>|Duration::from_(?:secs|millis)|read_timeout_env", ctx):
        return "number", "code"
    if re.search(r'==\s*"(?:1|true|0|false)"|"true"\s*\||"1"\s*\||eq_ignore_ascii_case\("(?:true|1|yes)"\)|matches!\([^)]*"(?:1|true)"|parse::<bool>|is_truthy|as_bool|truthy', ctx):
        return "boolean", "code"
    if re.search(r'==\s*Ok\("[^"]+"\)|==\s*Some\("[^"]+"\)|==\s*"[^"]+"', ctx):
        return "string (compared to a fixed value)", "code"
    if re.search(r"PathBuf::from|AbsolutePathBuf|Path::new|\.join\(|canonicalize", ctx):
        return "path", "code"
    if re.search(r"\.is_ok\(\)|\.is_some\(\)|\.is_none\(\)|\.is_err\(\)", ctx):
        return "presence (set/unset)", "code"
    if re.search(r"(?:_HOME|_DIR|_PATH|_FILE|_ROOT)$", name):
        return "path", "name"
    return "string", "code"


def set_value(ln: str) -> str | None:
    m = re.search(r'(?:insert|env)\(\s*[^,]+,\s*"([^"]{0,40})"', ln) or re.search(r'\(\s*"[A-Z][A-Z0-9_]+",\s*"([^"]{0,40})"\s*\)', ln)
    return m.group(1) if m else None


env_reads: dict[str, dict] = {}


def env_rec(name):
    return env_reads.setdefault(name, {"reads": [], "sets": [], "clap": [], "build": [], "provider_env_key": []})


for rel, lines in RS_FILES.items():
    text = "\n".join(lines)
    crate = rel.split("/")[1]
    for m in READ_RE.finditer(text):
        helper = m.group(1) or m.group(2)
        for name in resolve_arg(m.group(3), m.group(4)):
            line = line_of(m.start(), text)
            ctx = statement(lines, line)
            read_as, basis = classify_read(ctx, name, helper)
            comment = doc_comment_above(rel, line, 3)
            const_comment = None
            if m.group(4):
                cl = CONST_LOC.get((m.group(4).split("::")[-1], name))
                if cl:
                    const_comment = doc_comment_above(cl[0], cl[1], 4)
            env_rec(name)["reads"].append({"rel": rel, "line": line, "crate": crate, "helper": helper, "read_as": read_as,
                                            "basis": basis, "comment": const_comment or comment,
                                            "const": m.group(4)})
    for m in SET_RE.finditer(text):
        for name in resolve_arg(m.group(3), m.group(4)):
            op = m.group(1) or m.group(2)
            env_rec(name)["sets"].append({"rel": rel, "line": line_of(m.start(), text), "crate": crate, "op": op,
                                          "value": set_value(lines[line_of(m.start(), text) - 1])})
    for m in CLAP_RE.finditer(text):
        env_rec(m.group(1))["clap"].append({"rel": rel, "line": line_of(m.start(), text), "crate": crate})
    for m in BUILD_RE.finditer(text):
        if m.group(2).startswith("CARGO_"):
            continue
        env_rec(m.group(2))["build"].append({"rel": rel, "line": line_of(m.start(), text), "crate": crate, "macro": m.group(1)})
    for m in ENV_KEY_RE.finditer(text):
        env_rec(m.group(1))["provider_env_key"].append({"rel": rel, "line": line_of(m.start(), text), "crate": crate})

# Second pass: env-like names that reach std::env only indirectly (name tables, env maps built
# for child processes, lookup helpers). Classify each reference line by what the code does there.
ENV_LIKE = re.compile(r"^(?:(?:CODEX|OPENAI|OTEL|SSL|RUST)_[A-Z0-9_]+|[A-Z_]+_PROXY|(?:http|https|all|no|ftp|ws|wss)_proxy)$")
ENV_CONST_NAME = re.compile(r"_ENV(?:_VAR|_KEY|_NAME)?S?$")
SET_LINE = re.compile(r"\.insert\(|\.env\(|\.envs\(|set_var|env_remove|remove_var|\.push\(\(|\.extend\(|=>\s*\(|\(\s*\"[A-Z_]+\",\s*[\"a-z]")
READ_LINE = re.compile(r"\bvar(?:_os)?\(|\.get\(|lookup|getenv|env_source|read_env|from_env|env_var|std::env")
indirect_names = collections.defaultdict(set)  # env name -> identifiers that carry it
for cname, vals in CONSTS.items():
    for v in vals:
        if ENV_LIKE.match(v) or (ENV_CONST_NAME.search(cname) and re.match(r"^[A-Z][A-Z0-9_]+$", v)):
            indirect_names[v].add(cname)
for rel, lines in RS_FILES.items():
    for ln in lines:
        for m in re.finditer(r'"([A-Za-z][A-Za-z0-9_]+)"', ln):
            if ENV_LIKE.match(m.group(1)):
                indirect_names[m.group(1)]
for name, idents in indirect_names.items():
    rec = env_reads.get(name)
    skip_reads = bool(rec and (rec["reads"] or rec["clap"]))
    skip_sets = bool(rec and rec["sets"])
    if skip_reads and skip_sets:
        continue
    pats = [re.compile(rf'"{re.escape(name)}"')] + [re.compile(rf"\b{re.escape(i)}\b") for i in idents]
    found_read, found_set = [], []
    for rel, lines in RS_FILES.items():
        for i, ln in enumerate(lines):
            if not any(p.search(ln) for p in pats):
                continue
            if re.match(r"^\s*(?:pub(?:\([^)]*\))?\s+)?(?:const|static)\s", ln):
                continue  # the definition itself
            window = " ".join(lines[max(0, i - 2): i + 2])
            if SET_LINE.search(ln) or (not READ_LINE.search(ln) and SET_LINE.search(window)):
                if not skip_sets:
                    found_set.append({"rel": rel, "line": i + 1, "crate": rel.split("/")[1], "op": "child env (indirect)",
                                      "value": set_value(ln)})
            elif READ_LINE.search(window) and not skip_reads:
                ctx = statement(lines, i + 1)
                read_as, basis = classify_read(ctx, name, "indirect")
                found_read.append({"rel": rel, "line": i + 1, "crate": rel.split("/")[1], "helper": "indirect lookup",
                                   "read_as": read_as, "basis": basis, "comment": doc_comment_above(rel, i + 1, 3), "const": None})
    if found_read or found_set:
        r = env_rec(name)
        r["reads"].extend(found_read)
        r["sets"].extend(found_set)

# RUST_LOG is read implicitly by tracing_subscriber's EnvFilter.
for rel, lines in RS_FILES.items():
    for i, ln in enumerate(lines):
        if re.search(r"EnvFilter::(?:try_)?from_default_env", ln):
            env_rec("RUST_LOG")["reads"].append({"rel": rel, "line": i + 1, "crate": rel.split("/")[1],
                                                 "helper": "EnvFilter::from_default_env", "read_as": "string", "basis": "code",
                                                 "comment": None, "const": None})

# Environment variables named in help output (clap `[env: NAME]`); values are never kept.
HELP_ENV = collections.defaultdict(list)
for hp in sorted((CAP / "help").glob("*.txt")):
    for m in re.finditer(r"\[env: ([A-Z][A-Z0-9_]+)(?:=[^\]]*)?\]", hp.read_text()):
        cmd = "codex " + hp.stem.replace("_", " ") if hp.stem != "root" else "codex"
        if cmd not in HELP_ENV[m.group(1)]:
            HELP_ENV[m.group(1)].append(cmd)
for name in HELP_ENV:
    env_rec(name)

# Docs: env var reference table rows, plus mentions on the other fetched pages.
ENV_DOC_ROWS = {}
env_page = DOC_PAGES["config-file/environment-variables"]
for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", env_page, re.S):
    cells = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
    if cells and re.match(r"^[A-Z][A-Z0-9_]+$", cells[0]):
        ENV_DOC_ROWS[cells[0]] = cells[1:]


def env_docs(name: str):
    urls = [ENV_DOC_URL] if name in ENV_DOC_ROWS else []
    if len(name) >= 4:
        urls += mentioned_in_code(name, "config-file/environment-variables")
    return urls


def env_group(name: str, rec: dict) -> str:
    only_sets = rec["sets"] and not (rec["reads"] or rec["clap"] or rec["provider_env_key"])
    if only_sets:
        return "Set or cleared by Codex/ChatGPT for child processes"
    if rec["build"] and not (rec["reads"] or rec["clap"] or rec["provider_env_key"]):
        return "Build-time variables (compiled in)"
    rules = [
        ("Authentication, providers and network", r"API_KEY|TOKEN|AUTH|BASE_URL|ENDPOINT|^OPENAI_|^AWS_|^AZURE|CA_CERT|SSL_CERT|PROXY|IDENTITY|FEDERATION|ORIGINATOR|CHATGPT|LOGIN|ACCOUNT|WORKSPACE|_URL$|_HOST$"),
        ("Models, prompts and features", r"MODEL|PROMPT|INSTRUCTION|FEATURE|REASONING|CACHE|EFFORT|COMPACT|TOKEN_LIMIT|PERSONALITY|MEMOR|SKILL|PLUGIN|AGENT"),
        ("Sandbox, shell and execution", r"SANDBOX|SECCOMP|LANDLOCK|BWRAP|EXEC|SHELL|PTY|TERM|APPLY_PATCH|ESCALAT|LINUX|WINDOWS|SEATBELT|NETWORK"),
        ("MCP", r"MCP"),
        ("Paths and state", r"HOME|_DIR$|_PATH$|SQLITE|_ROOT$|_FILE$|CWD"),
        ("Logging, telemetry and diagnostics", r"LOG|OTEL|TRACE|DEBUG|SENTRY|^RUST_|ANALYTICS|TELEMETRY|METRIC|FEEDBACK"),
    ]
    for g, rx in rules:
        if re.search(rx, name):
            return g
    return "Other CLI variables"


ENV_GROUP_ORDER = [
    "Authentication, providers and network", "Models, prompts and features", "Sandbox, shell and execution", "MCP",
    "Paths and state", "Logging, telemetry and diagnostics", "Other CLI variables",
    "Desktop app: Codex/ChatGPT-specific", "Set or cleared by Codex/ChatGPT for child processes",
    "Build-time variables (compiled in)", "Desktop app: platform and bundled-library variables",
    "In source only (not in this macOS binary: other-platform, test or dev builds)",
]

env_items: list[dict] = []
for name in sorted(env_reads):
    rec = env_reads[name]
    if not (rec["reads"] or rec["clap"] or rec["sets"] or rec["build"] or rec["provider_env_key"] or name in HELP_ENV):
        continue
    bp = binary_presence(name)
    group = env_group(name, rec)
    if not bp["present"] and group != "Build-time variables (compiled in)":
        group = "In source only (not in this macOS binary: other-platform, test or dev builds)"
    prov = []
    for r in (rec["reads"] + rec["clap"] + rec["provider_env_key"])[:6]:
        prov.append(src_prov(r["rel"], r["line"], r.get("helper") and f"read via {r['helper']}" or ("clap env attribute" if r in rec["clap"] else "provider env_key default")))
    for r in rec["sets"][:3]:
        prov.append(src_prov(r["rel"], r["line"], f"{r['op']} (sets/clears for a child process)"))
    for r in rec["build"][:2]:
        prov.append(src_prov(r["rel"], r["line"], f"{r['macro']}! (build time)"))
    if bp["present"]:
        prov.append({"source": BIN_PROV, "note": "name string present in binary"})
    if name in HELP_ENV:
        prov.append({"source": BIN_PROV, "note": "clap [env: …] annotation in " + ", ".join(HELP_ENV[name])})
    read_as = sorted({r["read_as"] for r in rec["reads"]})
    if rec["clap"] or name in HELP_ENV:
        read_as = sorted(set(read_as) | {"string (clap argument fallback)"})
    if rec["provider_env_key"]:
        read_as = sorted(set(read_as) | {"string (model provider env_key)"})
    comment = next((r["comment"] for r in rec["reads"] if r["comment"]), None)
    comment_src = next((src_prov(r["rel"], r["line"])["source"] for r in rec["reads"] if r["comment"]), None)
    urls = env_docs(name)
    doc_row = ENV_DOC_ROWS.get(name)
    if doc_row:
        desc = {"text": short(doc_row[-1]), "source": ENV_DOC_URL}
    elif comment:
        desc = {"text": short(comment, 300), "source": comment_src}
    else:
        desc = None
    crates = sorted({r["crate"] for r in rec["reads"] + rec["clap"] + rec["sets"] + rec["build"] + rec["provider_env_key"]})
    fns = []
    for r in rec["reads"] + rec["sets"]:
        f = enclosing_fn(r["rel"], r["line"])
        if f and f"{r['crate']}::{f}" not in fns:
            fns.append(f"{r['crate']}::{f}")
    env_items.append({
        "id": "env:" + name,
        "title": name,
        "group": group,
        "kind": "env-var",
        "text": None,
        "when": None,
        "documented": bool(urls),
        "details": {
            "name": name,
            "read_by": "CLI (bundled codex binary)" if group != "In source only (not in this macOS binary: other-platform, test or dev builds)" else "Rust source only (not compiled into this macOS binary)",
            "crates": crates,
            "used_in_functions": fns[:8] or None,
            "read_as": read_as or None,
            "read_as_basis": sorted({r["basis"] for r in rec["reads"]}) or None,
            "default": {"text": doc_row[-2], "source": ENV_DOC_URL} if doc_row and len(doc_row) >= 3 else None,
            "description": desc,
            "read_sites": len(rec["reads"]) + len(rec["clap"]) + len(rec["provider_env_key"]),
            "set_for_child_sites": len(rec["sets"]),
            "values_set_for_child": sorted({r["value"] for r in rec["sets"] if r.get("value") is not None}) or None,
            "build_time_sites": len(rec["build"]),
            "clap_subcommands": HELP_ENV.get(name) or None,
            "docs_urls": urls,
            "binary": bp,
        },
        "provenance": prov,
    })

# Desktop app (Electron main-process bundles in app.asar).
APP_PREFIXES = r"^(CODEX_|OPENAI_|VITE_CODEX_|NODE_REPL_|SKY_|SPARKLE_|BUILD_FLAVOR$|ELECTRON_RENDERER_URL$|RUST_LOG$)"
desktop = collections.defaultdict(lambda: {"files": collections.Counter(), "ctx": []})
for fname, p in ASAR_JS.items():
    js = p.read_text(errors="replace")
    for m in re.finditer(r"process\.env(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[[\"']([A-Za-z_][A-Za-z0-9_]*)[\"']\])", js):
        name = m.group(1) or m.group(2)
        desktop[name]["files"][fname] += 1
        if len(desktop[name]["ctx"]) < 3:
            desktop[name]["ctx"].append(js[m.start(): m.end() + 60])


def classify_js(ctxs: list[str], name: str) -> tuple[str, str]:
    c = " ".join(ctxs)
    if re.search(rf'{name}\s*===?\s*["\'](?:1|true|0|false)["\']|!!process\.env', c):
        return "boolean", "code"
    if re.search(r"parseInt|Number\(|parseFloat", c):
        return "number", "code"
    if re.search(r"(?:_HOME|_DIR|_PATH|_ROOT|_FILE)$", name):
        return "path", "name"
    return "string", "code"


for name in sorted(desktop):
    d = desktop[name]
    app_owned = bool(re.match(APP_PREFIXES, name))
    group = "Desktop app: Codex/ChatGPT-specific" if app_owned else "Desktop app: platform and bundled-library variables"
    read_as, basis = classify_js(d["ctx"], name)
    urls = env_docs(name)
    existing = next((it for it in env_items if it["title"] == name), None)
    prov = [{"source": f"app.asar:.vite/build/{f}", "note": f"process.env read x{c} (ChatGPT desktop {APP_VERSION})"} for f, c in d["files"].most_common()]
    if existing:
        existing["details"]["read_by"] += "; desktop app (Electron main process)"
        existing["details"]["desktop_read_as"] = read_as
        existing["provenance"].extend(prov)
        continue
    env_items.append({
        "id": "env:" + name,
        "title": name,
        "group": group,
        "kind": "env-var",
        "text": None,
        "when": "desktop app (Electron main process)",
        "documented": bool(urls),
        "details": {
            "name": name,
            "read_by": "desktop app (Electron main process)",
            "read_as": [read_as],
            "read_as_basis": [basis],
            "default": None,
            "description": None,
            "origin": "Codex/ChatGPT desktop code" if app_owned else "platform variable or bundled third-party library",
            "docs_urls": urls,
            "binary": None,
        },
        "provenance": prov,
    })

# --------------------------------------------------------------------------------------
# Write JSON
# --------------------------------------------------------------------------------------
def order_key_config(it):
    groups = [g for g, _ in CONFIG_GROUPS] + ["Other settings", KEYMAP_GROUP, HIDDEN_GROUP, DOCS_ONLY_GROUP, REQ_GROUP]
    return (groups.index(it["group"]) if it["group"] in groups else 99, it["title"])


config_items.sort(key=order_key_config)
env_items.sort(key=lambda it: (ENV_GROUP_ORDER.index(it["group"]), it["title"]))

config_doc = {
    "area": "codex-config",
    "version": {
        "desktop_app": f"com.openai.codex {APP_VERSION}",
        "codex_cli": CLI_VERSION,
        "codex_binary_sha256": BIN_SHA,
        "source_tag": TAG,
        "source_commit": (CAP / "source-commit.txt").read_text().strip() if (CAP / "source-commit.txt").exists() else None,
        "docs_snapshot": "fetched 2026-09-25 from developers.openai.com/codex (redirects to learn.chatgpt.com/docs)",
    },
    "items": config_items,
}
env_doc = {"area": "codex-env-vars", "version": config_doc["version"], "items": env_items}
OUT.mkdir(exist_ok=True)
(OUT / "codex-config.json").write_text(json.dumps(config_doc, indent=2, ensure_ascii=False) + "\n")
(OUT / "codex-env-vars.json").write_text(json.dumps(env_doc, indent=2, ensure_ascii=False) + "\n")

# Probe candidates for 03_probe_strict_config.py.
cands = [it["title"] for it in config_items if it["group"] in (HIDDEN_GROUP, DOCS_ONLY_GROUP)
         or it["details"].get("status", "").startswith("documented; ")]
(CAP / "probe-candidates.json").write_text(json.dumps(
    [{"path": it["title"], "type": it["details"].get("type") or it["details"].get("docs_type")}
     for it in config_items if it["title"] in cands], indent=1))

# Stash summary data for the markdown renderer.
(CAP / "extract-meta.json").write_text(json.dumps({
    "extra_binary_features": extra_binary_features,
    "docs_only": docs_only,
    "profile_keys": PROFILE_KEYS,
}, indent=1))
print(f"config items: {len(config_items)}  env items: {len(env_items)}  docs-only keys: {len(docs_only)}")
