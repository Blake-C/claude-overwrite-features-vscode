#!/bin/bash
#
# Claude Code update watcher — launchd entry point.
#
# Fires when ~/.vscode/extensions changes (a new anthropic.claude-code-* dir
# appears). Detects the new version, runs the deterministic patch health check,
# and — only when a patch has actually broken — launches headless Claude to
# rewrite the broken patch strings on a NEW BRANCH. main is never touched and
# nothing is auto-installed; the user reviews and merges.
#
# Safe to run by hand:  bash scripts/on-claude-update.sh
#
set -uo pipefail

# --- Resolve repo root (this script lives in <repo>/scripts) --------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

STATE_FILE="$HOME/.claude/claude-overwrite-watcher.state"
LOG_FILE="$HOME/Library/Logs/claude-overwrite-watcher.log"
LOCK_DIR="${TMPDIR:-/tmp}/claude-overwrite-watcher.lock"
EXT_ROOT="$HOME/.vscode/extensions"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE" >&2; }

notify() {
	# $1 = title, $2 = message
	osascript -e "display notification \"${2//\"/\\\"}\" with title \"${1//\"/\\\"}\"" >/dev/null 2>&1 || true
}

# --- Environment: launchd runs with a bare PATH; load node via fnm --------
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
if command -v fnm >/dev/null 2>&1; then
	eval "$(fnm env 2>/dev/null)" || true
fi
NODE_BIN="$(command -v node || true)"
CLAUDE_BIN="$HOME/.local/bin/claude"
[ -x "$CLAUDE_BIN" ] || CLAUDE_BIN="$(command -v claude || true)"

# --- Single-run lock ------------------------------------------------------
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
	# Another run is in progress; let it finish.
	exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null' EXIT

# --- Find newest installed Claude Code version ----------------------------
[ -d "$EXT_ROOT" ] || exit 0
NEWEST_DIR="$(ls -d "$EXT_ROOT"/anthropic.claude-code-*-darwin-* 2>/dev/null \
	| sed -E 's/.*anthropic\.claude-code-([0-9]+\.[0-9]+\.[0-9]+)-.*/\1 &/' \
	| sort -V | tail -n1 | cut -d' ' -f2-)"
[ -n "$NEWEST_DIR" ] || exit 0
VERSION="$("$NODE_BIN" -e "process.stdout.write(require('$NEWEST_DIR/package.json').version)" 2>/dev/null)"
[ -n "$VERSION" ] || exit 0

# --- Skip if we have already handled this version -------------------------
LAST_SEEN="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [ "$VERSION" = "$LAST_SEEN" ]; then
	exit 0
fi
log "Detected Claude Code v$VERSION (last handled: ${LAST_SEEN:-none})."

# --- Deterministic health check: is anything actually broken? -------------
if [ -z "$NODE_BIN" ]; then
	log "ERROR: node not found on PATH; cannot run health check."
	notify "Claude patch watcher" "node not found — could not check v$VERSION."
	exit 1
fi
HEALTH_OUT="$("$NODE_BIN" --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
	"$REPO/scripts/check-patches.ts" "$NEWEST_DIR" 2>&1)"
HEALTH_RC=$?
log "Health check (rc=$HEALTH_RC):"
printf '%s\n' "$HEALTH_OUT" >>"$LOG_FILE"

if [ "$HEALTH_RC" -eq 0 ]; then
	log "All patches healthy for v$VERSION; the extension will re-apply them. No action needed."
	echo "$VERSION" >"$STATE_FILE"
	exit 0
elif [ "$HEALTH_RC" -ne 2 ]; then
	log "Health check errored (rc=$HEALTH_RC). Leaving state unchanged for retry."
	notify "Claude patch watcher" "Health check failed for v$VERSION — see log."
	exit 1
fi

# --- Patches are broken: prepare an auto-fix branch -----------------------
log "Patches broken on v$VERSION — launching headless Claude to auto-fix."

if [ -z "$CLAUDE_BIN" ]; then
	log "ERROR: claude CLI not found; cannot auto-fix."
	notify "Claude patch watcher" "Patches broke on v$VERSION but claude CLI was not found."
	exit 1
fi

# Guard: only auto-fix from a clean main, so we never commit over unrelated WIP.
BRANCH="$(git -C "$REPO" symbolic-ref --short HEAD 2>/dev/null || true)"
if [ "$BRANCH" != "main" ] || [ -n "$(git -C "$REPO" status --porcelain 2>/dev/null)" ]; then
	log "Working tree not clean on main (branch=$BRANCH). Aborting auto-fix; please handle manually."
	notify "Claude patch watcher" "Patches broke on v$VERSION. Repo not clean on main — fix manually."
	echo "$VERSION" >"$STATE_FILE"
	exit 1
fi

FIX_BRANCH="auto/patch-update-$VERSION"

read -r -d '' PROMPT <<EOF
Claude Code was updated to v$VERSION and this extension's string-literal patches no longer match the minified files. The health check reported broken patches:

$HEALTH_OUT

Fix them by following the repository's own documented workflow:
1. Read CLAUDE.md, especially the sections "Finding patches after a version update" and "Navigating the Claude Code webview". Use the Python search recipe there to locate the new patch sites in the installed files under:
   $NEWEST_DIR
2. Create and switch to a new branch named exactly: $FIX_BRANCH
3. Update the broken patch strings in src/patch-defs.ts (the from/to literals) so they match v$VERSION. Verify each new 'from' string appears EXACTLY ONCE in the relevant clean .backup file before trusting it.
4. Bump the version in package.json (patch bump), and update README.md, CHANGELOG.md, and CLAUDE.md per the conventions already used in those files.
5. Run 'npm run compile' and confirm it succeeds, then 'npx @vscode/vsce package' to produce the .vsix.
6. Commit the source/doc changes to the $FIX_BRANCH branch with a message in the repo's style (past-tense verb, no AI attribution).

Hard constraints: do NOT switch back to or commit on main. Do NOT install the .vsix. Do NOT push. If you cannot confidently locate a patch site, stop and explain rather than guessing.
EOF

cd "$REPO" || exit 1
log "Running: claude -p (branch $FIX_BRANCH)"
"$CLAUDE_BIN" -p "$PROMPT" \
	--add-dir "$REPO" \
	--permission-mode acceptEdits \
	--allowedTools "Read Edit Write Bash(git:*) Bash(npm:*) Bash(npx:*) Bash(node:*) Bash(python3:*) Bash(code:*)" \
	>>"$LOG_FILE" 2>&1
CLAUDE_RC=$?

# Record that we have handled this version (success or fail) to avoid re-running on every fs event.
echo "$VERSION" >"$STATE_FILE"

if [ "$CLAUDE_RC" -eq 0 ] && git -C "$REPO" rev-parse --verify "$FIX_BRANCH" >/dev/null 2>&1; then
	log "Auto-fix complete on branch $FIX_BRANCH (claude rc=0)."
	notify "Claude patch watcher" "Auto-fixed patches for v$VERSION on branch $FIX_BRANCH. Review and merge."
else
	log "Auto-fix did not complete cleanly (claude rc=$CLAUDE_RC). See log."
	notify "Claude patch watcher" "Auto-fix for v$VERSION needs attention — see log."
fi
