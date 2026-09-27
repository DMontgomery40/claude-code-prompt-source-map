#!/usr/bin/env python3
"""Self-check the four deliverables: JSON shape, provenance on every item, and no local leaks."""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "outputs"
FILES = ["codex-config.json", "codex-env-vars.json", "codex-config.md", "codex-env-vars.md"]
# Written by 07_cli_prompts.mjs: leak patterns, JSON shape and exact-match provenance only.
CLI_PROMPT_FILES = ["codex-cli-prompts.md", "codex-cli-bundled-skills.md", "codex-cli-prompts.json"]
LEAK_PATTERNS = {
    "home path": re.compile(r"/Users/|/home/[a-z]"),
    "local username": re.compile(r"davidmontgomery|dmontg", re.I),
    "api key": re.compile(r"\bsk-[A-Za-z0-9_-]{8,}"),
    "jwt": re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    "clap env value": re.compile(r"\[env: [A-Z0-9_]+=[^\]]+\]"),
    "bearer token": re.compile(r"Bearer [A-Za-z0-9._-]{20,}"),
}
re_sha = re.compile(r"[0-9a-f]{64}")
REQUIRED = ("id", "title", "group", "kind", "text", "when", "documented", "details", "provenance")

errors = []
for name in FILES:
    text = (OUT / name).read_text()
    for label, rx in LEAK_PATTERNS.items():
        for m in rx.finditer(text):
            errors.append(f"{name}: possible {label} leak: {text[max(0, m.start() - 40): m.end() + 20]!r}")
    if not name.endswith(".json"):
        continue
    doc = json.loads(text)
    if set(doc) != {"area", "version", "items"}:
        errors.append(f"{name}: top-level keys {sorted(doc)}")
    ids = set()
    for it in doc["items"]:
        missing = [k for k in REQUIRED if k not in it]
        if missing:
            errors.append(f"{name}: {it.get('id')} missing {missing}")
        if it["id"] in ids:
            errors.append(f"{name}: duplicate id {it['id']}")
        ids.add(it["id"])
        if it["kind"] not in ("setting", "env-var") or it["text"] is not None or not isinstance(it["documented"], bool):
            errors.append(f"{name}: {it['id']} bad kind/text/documented")
        prov = it["provenance"]
        if not prov or not all(isinstance(p, dict) and p.get("source") for p in prov):
            errors.append(f"{name}: {it['id']} has no usable provenance")
        if it["documented"] and not it["details"].get("docs_urls"):
            errors.append(f"{name}: {it['id']} documented without a docs URL")
    print(f"{name}: {len(doc['items'])} items, {sum(i['documented'] for i in doc['items'])} documented")

for name in CLI_PROMPT_FILES:
    text = (OUT / name).read_text()
    for label, rx in LEAK_PATTERNS.items():
        for m in rx.finditer(text):
            errors.append(f"{name}: possible {label} leak: {text[max(0, m.start() - 40): m.end() + 20]!r}")
cli = json.loads((OUT / "codex-cli-prompts.json").read_text())
for it in cli["items"]:
    if not (it.get("source") and it.get("executable") and re_sha.fullmatch(it.get("sha256", ""))):
        errors.append(f"codex-cli-prompts.json: {it.get('id')} lacks source, executable or sha256")
print(f"codex-cli-prompts.json: {len(cli['items'])} items verified in {cli['source']['cli_version']}")

if errors:
    print(f"{len(errors)} problem(s):")
    for e in errors[:60]:
        print("  " + e)
    sys.exit(1)
print("OK: JSON parses, every item has provenance, no leak patterns found")
