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

This is a single-file VS Code extension (`src/extension.ts`) whose sole job is to patch the installed Claude Code extension's files on startup.

**How patching works:**

On `activate()`, the extension:
1. Locates Claude Code via `vscode.extensions.getExtension('anthropic.claude-code')`
2. Reads three files from the Claude Code install directory: `webview/index.js`, `extension.js`, and `package.json`
3. Applies targeted string replacements defined in the `PATCHES` array — each patch has an optional `targetFile` field (`'webview'` | `'extension'` | `'packageJson'`) that routes it to the right file
4. Writes each modified file back and creates a `.backup` alongside it on first run
5. Stores the patched Claude Code version in `globalState` to detect future updates
6. Logs per-patch results (`✓` applied, `—` already applied, `✗` pattern not found) to the **Claude Code Patches** output channel

**The patches** (all patterns verified unique in the minified files):

| # | What | Target file | Notes |
|---|---|---|---|
| 1 | Default include-file toggle to OFF | `webview/index.js` | `n1.useState(!0)` → `n1.useState(!1)` in `De1` component's `[P,_]` state |
| 2 | Strip attachments from slash commands | `webview/index.js` | `$.send(x1,B,k5),W([])` → `$.send(x1,e1?[]:B,k5),W([])` — `e1` is `true` for slash commands |
| 3 | Confirm before compact | `webview/index.js` | Replaces the compact `onClick` with an inline `<dialog>` styled with VS Code CSS variables |
| 4 | Respect `~/.claude/settings.json` in plan mode | `extension.js` | Injects allow/deny list check before the tool-permission request is sent to the UI |
| 5 | Label panel as "Claude Code - Patched" | `package.json` | Renames all five `"title"/"name": "Claude Code"` entries in `viewsContainers`/`views` contributions |

**Version change detection:** If `claudeExt.packageJSON.version` differs from the stored `patchedClaudeCodeVersion` in `globalState`, patches are re-applied automatically and the user is warned.

**Revert path:** `.backup` files are restored via `claudeOverwrite.revertPatches`. If no backups exist, patches are reversed in-place using the `revertPatch()` helper (swaps `to` → `from`).

## Key constraint

Patches are string literals matched against minified code. If Claude Code updates and renames internal variables, a patch will silently report "pattern not found" rather than corrupt the file. Always verify patch strings against the actual installed file when the Claude Code version changes.

## Navigating the Claude Code webview

`webview/index.js` is ~4.8 MB of minified React on ~2045 long lines. `grep` produces unmanageably large output. Use Python for all searches:

```python
python3 -c "
with open('/path/to/webview/index.js', 'r') as f:
    content = f.read()
idx = content.find('YOUR_SEARCH_STRING')
print(idx, repr(content[max(0,idx-300):idx+300]))
"
```

For regex searches use `re.finditer`. Always anchor searches to unique surrounding context, not just the target string.

### Component map (minified names, v2.1.133)

| Minified name | Role |
|---|---|
| `De1` | Main chat view — owns `[B,W]` (attachedFiles) and `[P,_]` (includeSelection) state |
| `ot1` | Input/compose area (`forwardRef`) — receives `attachedFiles:Q`, `includeSelection:z`, `onSubmit:J` as props |
| `ft1` | Compact/context-usage button — receives `onCompact:J`, renders the circle percentage button |
| `ht1` | Input footer — assembles `ft1`, the attach/mention buttons, and the send button |
| `DL0` | Include-selection toggle button in the footer |

### Key functions

| Function | What it does |
|---|---|
| `VB1($,Z,J,...)` | Builds the message content array. `J` = IDE context (`{filePath, selectedText, startLine, endLine}`), `Z` = attached files. Injects `<ide_opened_file>` or `<ide_selection>` tags. |
| `YB1($,Z)` | Creates a compact message object: `new kz("compact",[],{compactMetadata:{trigger:$,preTokens:Z}})` |
| `C` (in `De1`) | The `useCallback` submit handler. Key locals: `e1` = `x1.startsWith("/")` (slash command flag), `B` = attached files, `k5 = P && !e1` (include-selection effective value). Calls `$.send(x1,B,k5)` then `W([])` to clear files. |
| `Y0` (in `ot1`) | The compact trigger: `()=>{J("/compact")}`. `J` here is `onSubmit`, not `onCompact`. |

### Data flow for message submission

```
User types → ot1 input → k1() (on Enter) → J(text) → C(text) in De1
  C builds: e1 (slash?), k5 (includeSelection), then calls $.send(text, B, k5)
  $.send → VB1 adds ide_opened_file/selection context + file attachments → sends to Claude CLI
  After send: W([]) clears attached files
```

### Compact flow

```
User clicks compact button (ft1) → onClick → <dialog> modal [Patch 3] → user confirms → J() (onCompact in ft1)
  → onCompact:z in ht1 → onCompact:Y0 in ot1 → Y0() → J("/compact") (onSubmit)
  → C("/compact") in De1 → e1=true → k5=false, B replaced with [] [Patch 2] → $.send("/compact",[],false)
```

### Finding patches after a version update

Search for stable string literals near the patch site rather than variable names (which change):

| Patch | File | Stable anchor to search for |
|---|---|---|
| 1 (includeSelection default) | `webview/index.js` | `"selectionLabel"` CSS class string nearby, or the `De1` component signature `function De1({session:` |
| 2 (attachments + slash) | `webview/index.js` | `"remote-control"` or `"/rc"` string in the same `if` block |
| 3 (compact confirm) | `webview/index.js` | `"Click to compact now."` text string — the button is within a few hundred chars |
| 4 (plan-mode permissions) | `extension.js` | `tool_permission_request` string — the injection site is immediately after the first early-return `behavior:"allow"` before that string |
| 5 (panel label) | `package.json` | `"id": "claude-sidebar"` and `"id": "claudeVSCodeSidebar"` — each followed by a `"title"` or `"name"` key |
