#!/bin/bash
#
# Install the Claude Code update watcher launchd agent.
# Substitutes absolute paths into the plist template and bootstraps it.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
LABEL="com.bcerecero.claude-overwrite-watcher"
TEMPLATE="$REPO/launchd/$LABEL.plist"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"

[ -f "$TEMPLATE" ] || { echo "Template not found: $TEMPLATE" >&2; exit 1; }

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

# Render the template with absolute paths.
sed -e "s#__REPO__#$REPO#g" -e "s#__HOME__#$HOME#g" "$TEMPLATE" >"$TARGET"

# Reload if already present.
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$TARGET"
launchctl enable "gui/$(id -u)/$LABEL" 2>/dev/null || true

echo "Installed and loaded: $TARGET"
echo "Logs: $HOME/Library/Logs/claude-overwrite-watcher.log"
