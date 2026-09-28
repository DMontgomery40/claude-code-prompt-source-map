#!/usr/bin/env bash
# Installs the watcher's LaunchAgent for this checkout (hourly at :07), replacing any older plist
# (the pre-merge one ran ~/prompt-watch). Only run it when David has said to turn the watcher on.
#   watch/install-launchd.sh            write ~/Library/LaunchAgents/com.dtmont.prompt-watch.plist and load it
#   watch/install-launchd.sh --print    print the plist it would write; change nothing
#   watch/install-launchd.sh --remove   stop the watcher and remove the plist
set -euo pipefail
LABEL=com.dtmont.prompt-watch
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DOMAIN="gui/$(id -u)"

if [ "${1:-}" = "--remove" ]; then
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
  launchctl disable "$DOMAIN/$LABEL"
  rm -f "$PLIST"
  echo "removed $LABEL"
  exit 0
fi

NODE="$(command -v node || true)"
[ -n "$NODE" ] && [ -x "$NODE" ] || { echo "node not found on PATH" >&2; exit 1; }
render() {
  sed -e "s#{{NODE}}#$NODE#g" -e "s#{{NODE_BIN}}#$(dirname "$NODE")#g" -e "s#{{REPO}}#$REPO#g" -e "s#{{HOME}}#$HOME#g" \
    "$REPO/watch/com.dtmont.prompt-watch.plist.template"
}
if [ "${1:-}" = "--print" ]; then render; exit 0; fi

mkdir -p "$REPO/watch/logs" "$(dirname "$PLIST")"
if [ -f "$PLIST" ]; then cp "$PLIST" "$PLIST.bak-$(date +%Y%m%d%H%M%S)"; fi
render > "$PLIST"
plutil -lint "$PLIST"
launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
launchctl enable "$DOMAIN/$LABEL"
launchctl bootstrap "$DOMAIN" "$PLIST"
echo "installed $LABEL for $REPO: runs hourly at :07; logs in watch/logs/"
