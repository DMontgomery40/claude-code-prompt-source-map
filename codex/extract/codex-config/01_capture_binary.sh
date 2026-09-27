#!/usr/bin/env bash
# Capture everything the bundled Codex CLI binary says about its own config surface:
# every subcommand's --help, `codex features list` against an empty CODEX_HOME (so no
# user config.toml is ever read), and the printable strings used to verify keys.
#
# Usage: extract/codex-config/01_capture_binary.sh [WORK_DIR]
set -euo pipefail

# CODEX runs the CLI (the app's entrypoint shim); CODEX_BINARY is the executable it runs,
# which is what gets hashed and scanned for strings.
LAYOUT="$(cd "$(dirname "$0")/.." && pwd)/codex/lib/app-layout.mjs"
CODEX="${CODEX_BIN:-$(node "$LAYOUT" entrypoint)}"
CODEX_BINARY="${CODEX_BINARY:-${CODEX_BIN:-$(node "$LAYOUT" binary)}}"
WORK="${1:-$(cd "$(dirname "$0")/../.." && pwd)/work/codex-config}"
mkdir -p "$WORK/help"

# Every run below uses a scrubbed environment and a fresh, empty CODEX_HOME (a mktemp
# directory), so clap's `[env: NAME=value]` annotations and feature state cannot pick up
# anything from the local user's shell or ~/.codex.
EMPTY_HOME="$(mktemp -d)"
codex_clean() { env -i PATH=/usr/bin:/bin HOME="$EMPTY_HOME" CODEX_HOME="$EMPTY_HOME" "$CODEX" "$@"; }

codex_clean --version > "$WORK/version.txt"
shasum -a 256 "$CODEX_BINARY" | awk '{print $1}' > "$WORK/codex.sha256"

# Recursively walk subcommands listed under "Commands:" in each help page.
walk() {
  local prefix="$1"
  local name="${prefix// /_}"
  [ -z "$name" ] && name="root"
  # shellcheck disable=SC2086
  codex_clean $prefix --help > "$WORK/help/$name.txt" 2>&1 || true
  local subs
  subs=$(awk '/^Commands:/{f=1;next} /^[A-Z][a-z]+:/{f=0} f && /^  [a-z]/{print $1}' "$WORK/help/$name.txt" | grep -v '^help$' || true)
  for s in $subs; do
    walk "${prefix:+$prefix }$s"
  done
}
walk ""

# Feature registry as the binary reports it; the empty CODEX_HOME means compiled-in defaults.
codex_clean features list > "$WORK/features-list.txt" 2>&1 || true

strings -a -n 3 "$CODEX_BINARY" > "$WORK/codex.strings.txt"
echo "captured $(ls "$WORK/help" | wc -l | tr -d ' ') help pages into $WORK"
