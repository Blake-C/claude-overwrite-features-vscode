#!/bin/bash
#
# Uninstall the Claude Code update watcher launchd agent.
#
set -euo pipefail

LABEL="com.bcerecero.claude-overwrite-watcher"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$TARGET"

echo "Uninstalled: $LABEL"
echo "(State file ~/.claude/claude-overwrite-watcher.state and logs were left in place.)"
