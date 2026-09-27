#!/usr/bin/env bash
# Rebuild outputs/codex-config.{json,md}, outputs/codex-env-vars.{json,md} and the Codex CLI
# prompt pages (outputs/codex-cli-*) from scratch.
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"
"$D/00_fetch_sources.sh"
"$D/01_capture_binary.sh"
python3 "$D/02_extract.py"            # first pass writes the probe candidate list
python3 "$D/03_probe_strict_config.py"
python3 "$D/02_extract.py"            # second pass folds probe results in
python3 "$D/04_render_md.py"
node "$D/07_cli_prompts.mjs"         # prompts compiled into the CLI, verified byte for byte
python3 "$D/05_check.py"
node "$D/06_tags.mjs"                # status tags from the records; topic tags via Jev (cached)
