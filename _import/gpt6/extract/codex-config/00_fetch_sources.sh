#!/usr/bin/env bash
# Fetch the non-binary inputs into the gitignored work/ directory:
#   - openai/codex at the release tag matching the bundled CLI (read from `codex --version`)
#   - the official Codex docs pages used to mark items documented
#   - the Electron main-process bundles (.vite/build/*.js) from the desktop app's app.asar
#
# Usage: extract/codex-config/00_fetch_sources.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$REPO/work"
LAYOUT="$REPO/extract/codex/lib/app-layout.mjs"   # honors CODEX_APP_PATH
CLI="$(node "$LAYOUT" entrypoint)"
TAG="rust-v$("$CLI" --version | awk '{print $2}')"
ASAR_FILE="$(node "$LAYOUT" asar)"
mkdir -p "$WORK/codex-config/docs" "$WORK/asar-build"

# One checkout per release tag; work/codex-src points at the current one. A missing tag
# fails the run, so the watcher reports it instead of describing older source.
if [ ! -d "$WORK/codex-src-$TAG" ]; then
  git clone --depth 1 --branch "$TAG" https://github.com/openai/codex.git "$WORK/codex-src-$TAG"
fi
if [ -d "$WORK/codex-src" ] && [ ! -L "$WORK/codex-src" ]; then mv "$WORK/codex-src" "$WORK/codex-src-previous"; fi
ln -sfn "codex-src-$TAG" "$WORK/codex-src"
echo "$TAG" > "$WORK/codex-config/tag.txt"
git -C "$WORK/codex-src" rev-parse HEAD > "$WORK/codex-config/source-commit.txt"

# Docs pages (developers.openai.com/codex/* currently redirects to learn.chatgpt.com/docs/*).
DOC_PAGES="config-file/config-reference config-file/environment-variables config-file/config-advanced
config-file/config-basic config-file/config-sample config-schema.json enterprise/managed-configuration hooks
notifications sandboxing permissions permission-modes extend/mcp feature-maturity reference/settings
cli-customization developer-settings auth amazon-bedrock non-interactive-mode windows/windows-sandbox
agent-configuration/subagents customization/memories model-selection agent-approvals-security
sandboxing/auto-review app-server codex-sdk reference/commands cli remote-connections web-search
agent-configuration/speed agent-configuration/rules security-administration hipaa-configuration
cyber-safety/recommended-configuration reference/troubleshooting integrated-terminal"
: > "$WORK/codex-config/docs/pages.txt"
for p in $DOC_PAGES; do
  f="$(echo "$p" | tr '/' '_').html"
  curl -sL -A 'Mozilla/5.0' "https://developers.openai.com/codex/$p" -o "$WORK/codex-config/docs/$f"
  echo "$p $f $(wc -c < "$WORK/codex-config/docs/$f" | tr -d ' ')" >> "$WORK/codex-config/docs/pages.txt"
done

# Main-process JavaScript from app.asar (where the desktop app itself reads process.env).
npx -y @electron/asar list "$ASAR_FILE" > "$WORK/asar-list.txt"
(
  cd "$WORK/asar-build"
  grep -E '^/\.vite/build/[^/]+\.js$' "$WORK/asar-list.txt" | while read -r f; do
    npx -y @electron/asar extract-file "$ASAR_FILE" "${f#/}"
  done
)
echo "sources ready under $WORK"
