# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build commands

All node/npm commands require NVM — always source it first:

```bash
source ~/.nvm/nvm.sh && nvm use --lts
```

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Development build | `npm run compile` |
| Production build | `npm run package` |
| Watch mode | `npm run watch` |
| Package `.vsix` | `npx @vscode/vsce package` |
| Install locally | `code --install-extension claude-overwrite-features-0.1.0.vsix` |

There are no tests.

## Architecture

This is a single-file VS Code extension (`src/extension.ts`) whose sole job is to patch the installed Claude Code extension's webview on startup.

**How patching works:**

On `activate()`, the extension:
1. Locates Claude Code via `vscode.extensions.getExtension('anthropic.claude-code')`
2. Reads `<claudeCodePath>/webview/index.js` (a ~4.8 MB minified React bundle)
3. Applies three targeted string replacements (defined in the `PATCHES` array)
4. Writes the file back and creates `index.js.backup` on first run
5. Stores the patched Claude Code version in `globalState` to detect future updates

**The three patches** (all patterns verified unique in the minified file):

| # | What | `from` → `to` |
|---|---|---|
| 1 | Default include-file toggle to OFF | `n1.useState(!0)` → `n1.useState(!1)` (in `De1` component's `[P,_]` state) |
| 2 | Strip attachments from slash commands | `$.send(x1,B,k5)` → `$.send(x1,e1?[]:B,k5)` (`e1` is already `true` for slash commands) |
| 3 | Confirm before compact | Wraps `onClick:J` on the compact button with `window.confirm(...)&&J()` |

**Version change detection:** If `claudeExt.packageJSON.version` differs from the stored `patchedClaudeCodeVersion` in `globalState`, patches are re-applied automatically and the user is warned.

**Revert path:** `index.js.backup` is restored via `claudeOverwrite.revertPatches`. If no backup exists, patches are reversed in-place using the `revertPatch()` helper (swaps `to` → `from`).

## Key constraint

Patches are string literals matched against minified code. If Claude Code updates and renames internal variables, a patch will silently report "pattern not found" rather than corrupt the file. Always verify patch strings against the actual installed file when the Claude Code version changes.
