# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Development build | `npm run compile` |
| Production build | `npm run package` |
| Watch mode | `npm run watch` |
| Package `.vsix` | `npm run vsix` |
| Install locally | `code --install-extension claude-overwrite-features-0.7.3.vsix` |

`vsce` is a devDependency, so `npm run vsix` runs the local binary and needs no network. Do not use `npx @vscode/vsce package` — npx resolves the unpinned spec against the registry, which fails under the Bash sandbox.

`vsce` rewrites every relative link in `README.md` into an absolute URL, and it reads the base URL from the `repository` field in `package.json`. If that field is removed while the README still has a relative link, `npm run vsix` fails with "Couldn't detect the repository where this extension is published".

There are no tests.

## Versioning

After any substantial change (new patch, bug fix, behavior change), bump the version in `package.json` and repackage:

1. Increment the `"version"` field in `package.json` (e.g. `0.1.0` → `0.2.0`)
2. Run `npm run vsix` to produce the new `.vsix`
3. Run `code --install-extension claude-overwrite-features-<version>.vsix` to install it

Use semantic versioning: patch bump (0.1.x) for fixes and minor tweaks, minor bump (0.x.0) for new features.

## Architecture

This is a VS Code extension whose sole job is to patch the installed Claude Code extension's files on startup. Source layout:

- `src/extension.ts` — `activate()`, command registration, compact-dialog preview.
- `src/patch-defs.ts` — **vscode-free** patch data and pure helpers: the `Patch` interface, the `PATCHES` array, `applyPatch`/`revertPatch`/`getPatchesByTarget`, and the file-name constants. This file imports nothing from `vscode` so plain Node (e.g. the watcher's health check) can import it directly. **Edit patch strings here.**
- `src/patches.ts` — the vscode-dependent file IO and output-channel logic (`patchWebview`, `revertWebview`, `applyPatchesToFile`); re-exports `PATCHES`/`Patch`/`STATE_KEY_PATCHED_VERSION` for `extension.ts`.
- `src/ollama.ts` — Ollama local-model commands.
- `scripts/` — the optional auto-update watcher (see "Auto-update watcher" below).

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
| 1 | Send only a real selection, not the open file | `webview/index.js` | Patches the tail of `applySelectionUpdate` so the session stores a selection only when it carries `selectedText`. Having a file open attaches nothing and shows no chip, selecting text shows the chip and sends it, and the X still dismisses it. Replaced the toggle-default patch in v0.7.0, because v2.1.270 removed the toggle. v2.1.270: `this.dismissedSelection=void 0,this.selection.value=$` → `this.dismissedSelection=void 0,this.selection.value=$?.selectedText?$:void 0` |
| 2 | Strip attachments from slash commands | `webview/index.js` | Skips attachments when the message is a slash command. The reset-toggle half was dropped in v2.1.270 because the toggle setter no longer exists. v2.1.274: `await $.send(Z1,W,u1,{kind:"human"}),B([]),$x(Q,!0)` → `await $.send(Z1,I1?[]:W,u1,{kind:"human"}),B([]),$x(Q,!0)` |
| 3 | Confirm before compact | `webview/index.js` | Replaces the compact `onClick` with an inline `<dialog>` styled with VS Code CSS variables. v2.1.274: the component is `N45` (was `f25`) and the `onCompact` prop is still `J`, so the dialog's confirm branch calls `J()` |
| 4 | Respect `~/.claude/settings.json` in plan mode | `extension.js` | Injects allow/deny list check before the tool-permission request is sent to the UI |
| 5 | Label panel as "Claude Code - Patched" | `package.json` | Renames all five `"title"/"name": "Claude Code"` entries in `viewsContainers`/`views` contributions |

**Version change detection:** If `claudeExt.packageJSON.version` differs from the stored `patchedClaudeCodeVersion` in `globalState`, patches are re-applied automatically and the user is warned.

**Revert path:** `.backup` files are restored via `claudeOverwrite.revertPatches`. If no backups exist, patches are reversed in-place using the `revertPatch()` helper (swaps `to` → `from`).

## Key constraint

Patches are string literals matched against minified code. If Claude Code updates and renames internal variables, a patch will silently report "pattern not found" rather than corrupt the file. Always verify patch strings against the actual installed file when the Claude Code version changes.

If it appears that Anthropic has fixed a patch internally within the plugin, report it to the code author.

Update CLAUDE.md file when new findings are made to keep knowledge up to date.

## Auto-update watcher (`scripts/`)

An optional macOS launchd agent self-heals patches when Claude Code updates. It separates the work into a deterministic half (no AI) and a semantic half (AI), and only invokes Claude for the latter.

| File | Role |
|---|---|
| `scripts/check-patches.ts` | Deterministic health check. Run with Node 24+ native TS: `node scripts/check-patches.ts [installDir]`. Reuses `applyPatch`/`getPatchesByTarget` from `patch-defs.ts`. A patch is **broken** when neither its `from` nor `to` is present. Exit 0 = healthy, 2 = broken, 1 = error. Auto-detects the newest `~/.vscode/extensions/anthropic.claude-code-*` if no dir given. |
| `scripts/on-claude-update.sh` | launchd entry point. Sets up node via fnm (launchd has a bare PATH), single-run lock, diffs the newest installed version against `~/.claude/claude-overwrite-watcher.state`, runs the health check, and **only if broken** launches `claude -p` on branch `auto/patch-update-<version>` with a scoped `--allowedTools` allowlist. Guards on a clean `main`. Never touches `main`, never installs. Notifies through `terminal-notifier` when it is installed, so clicking the notification reveals the log in Finder, and through `osascript` when it is not installed. Logs to `~/Library/Logs/claude-overwrite-watcher.log`. The state file is written only after a successful run; a failed run instead increments a per-version counter in `~/.claude/claude-overwrite-watcher.attempts` so the next filesystem event retries, and stops after 3 attempts on the same version. |
| `scripts/install-watcher.sh` / `uninstall-watcher.sh` | Render `launchd/com.Blake-C.claude-overwrite-watcher.plist` (substituting `__REPO__`/`__HOME__`) into `~/Library/LaunchAgents/` and `launchctl bootstrap`/`bootout` it. |
| `launchd/…​.plist` | Template. `WatchPaths` = `~/.vscode/extensions` (fires on any extension install; the script no-ops unless the Claude Code version actually changed). |

npm scripts: `check-patches`, `vsix`, `watcher:install`, `watcher:uninstall`, `watcher:run`.

The headless prompt tells Claude to follow the "Finding patches after a version update" and "Navigating the Claude Code webview" sections below, edit the `from`/`to` literals in `src/patch-defs.ts`, bump version + docs, compile, and commit to the branch. The script packages the `.vsix` itself after Claude exits, because the headless run has no network access and no way to answer a permission prompt. So keep those sections accurate — the watcher depends on them.

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

### Component map (v2.1.274)

The minifier generates these names and most of them change every release, so on a new version re-derive them from the anchors in "Finding patches after a version update" instead of trusting this table. Every name here was read out of the installed v2.1.274 bundle.

| Minified name | Role |
|---|---|
| `YU0` | Main chat view. Owns the attached-files state `[W,B]` and the submit handler `Z0`, so it contains the Feature 2 patch site. Signature: `function YU0({session:$,context:J,onCreateNewSession:Z,onTeleportCheckout:Y})` |
| `N45` | Compact/context-usage button. Takes `{percentageUsed:$,onCompact:J,buttonClassName:Z}` and renders the circle percentage button. Feature 3 replaces its `onClick`. The wrapper `Mq0` renders it and decides whether to show a button |
| `R45` | Selection chip in the footer, which replaced the include-selection toggle in v2.1.270. Takes `{currentSelection:$,onRemove:J}`, and its X button calls `onRemove`, which the footer sets to `session.dismissSelection()` |

The session class holds the Feature 1 patch site, and three of its methods handle the selection. `applySelectionUpdate($)` ends with `this.dismissedSelection=void 0,this.selection.value=$`. `dismissSelection()` stores the current selection in `this.dismissedSelection` and clears `this.selection.value`. `send($,J,Z,Y,X)` takes the selection flag as its third argument `Z` and reads `this.selection.value` only when `Z` is true.

The function that assembles the message content array injects the `<ide_opened_file>` and `<ide_selection>` tags, so search for `<ide_selection>`. That string occurs twice in v2.1.274 and the first hit is a parser, so take the second. The function that builds a compact message attaches `compactMetadata`, which occurs five times.

### Current release

**v2.1.274:** the minifier from v2.1.245 is still in use, and every change in this release is a rename. The component map above gives the renamed components. Features 1, 3, and 5 match as-is. Features 2 and 4 moved:

- Feature 1: `applySelectionUpdate` is unchanged and its parameter is still `$`, so the v0.7.0 strings match
- Feature 2: submit handler `Z0` (via `q0`/useCallback), command text is the callback argument `Z1` (was `z1`), isSlashCommand `I1` (was `r`), selection flag `u1=!I1` (was `w1=!r`), attached files `W` with setter `B`, scroll function `$x` (was `hy`) with ref `Q`. Site: `await $.send(Z1,W,u1,{kind:"human"}),B([]),$x(Q,!0)`. The handler's `catch(I1)` shadows `I1`, and `Z1`, `I1`, and `u1` are each reused elsewhere in the component, so match on the full send call
- Feature 3: the compact button component was renamed `f25`→`N45`, but its props are still `{percentageUsed:$,onCompact:J,buttonClassName:Z}`, so `onCompact` is still `J` and both halves of the `to` string match. Site: `click to compact\`,onClick:J,onMouseEnter:`
- Feature 4: only the stats helper was renamed, `dh$`→`mc$`. Every other variable holds its v2.1.273 position (see the v2.1.274 map in the Feature 4 row below)

### Release history

CHANGELOG.md holds the identifier map for every release this extension has tracked, from v2.1.158 on, so it is not repeated here. Four structural changes still affect the current patch strings:

- **v2.1.245** switched name manglers. Identifiers became `$`, `J`, `X`, `Y`, `Q`, `Z`, `W` and suffixed names like `D1`, `tk`, and `c90`, and the `session` prop became `$`, so the send call reads `$.send(...)`. No identifier from before this release carries over.
- **v2.1.263** restructured the tail of `requestToolPermission`. The stats-helper call is no longer part of a `return`, and an updatedPermissions block follows it, so the Feature 4 `from` string ends at the stats call instead of at the function's closing brace.
- **v2.1.268** gave `requestToolPermission` a sixth parameter, spread into the `sendRequest` payload as `suggestions:X,...z`.
- **v2.1.270** removed the include-selection toggle from the footer and replaced it with the selection chip. No toggle state is left to flip, so Feature 1 patches `applySelectionUpdate` in the session class, and the reset half of Feature 2 was dropped because there is no setter left to call.

### Data flow for message submission

Both diagrams name roles instead of minified identifiers.

```
User types → input area → submit handler in the main chat view
  handler sets isSlashCommand from a leading "/", then derives the selection flag as !isSlashCommand
  session.send(text, attachedFiles, selectionFlag, {kind:"human"})
    → the content builder adds the <ide_opened_file> or <ide_selection> tag and the attachments
    → sends to the Claude CLI
  after send: the attached-files setter is called with [] to clear them   [Feature 2 patch site]
```

v2.1.270 removed the includeSelection state and the reset step. `send()` skips a selection that matches `lastSentSelection` from the previous message.

### Compact flow

```
User clicks the compact button → onClick calls the onCompact prop   [unpatched: direct call]
  [Feature 3 replaces onClick] → <dialog> modal → user confirms → onCompact()
  → the footer's onCompact → the input area's onCompact → onSubmit("/compact")
  → submit handler in the main chat view → isSlashCommand is true → selection flag false,
    attachments replaced with []   [Feature 2]
  → session.send("/compact",[],false,{kind:"human"})
```

Note: Prior to v2.1.138, Claude Code itself rendered a `<dialog>` on compact with no VS Code styling. As of v2.1.138 that dialog was removed, and Patch 3 now builds the entire dialog from scratch.

### Finding patches after a version update

Search for stable string literals near the patch site rather than variable names (which change):

| Patch | File | Stable anchor to search for |
|---|---|---|
| 1 (real selection only) | `webview/index.js` | Search for `applySelectionUpdate` and patch the assignment at its tail, the statement immediately before `}dismissSelection(){`. The method reads `applySelectionUpdate($){...this.dismissedSelection=void 0,this.selection.value=$}`, and the patch appends `?.selectedText?$:void 0` to that assignment so a selection is stored only when it carries `selectedText`. The parameter is `$` from v2.1.270 through v2.1.274 and can be renamed in any release. The `from` string is a prefix of the `to` string, so a patched file still contains `from`; `applyPatch` tests `to` before `from`, so it does not apply this patch twice. When the anchor text changes, whether from a restructured `applySelectionUpdate` or a renamed parameter, this patch reports "pattern not found". Before v0.7.0 the patch site was an includeSelection toggle in the chat view, which v2.1.270 removed |
| 2 (attachments + slash) | `webview/index.js` | `"remote-control"` or `"/rc"` string in the same `if` block |
| 3 (compact confirm) | `webview/index.js` | `click to compact\`` in the button's `title` attribute. The patch site is `onClick:<onCompact prop>,onMouseEnter:`, and the prop is `J` from v2.1.272 on. Replace it with the dialog and call the same identifier in the dialog's confirm branch. Both halves of the `to` string change when the prop is renamed, and a `to` string that updates only the `onClick:` half compiles into a dialog whose Compact button does nothing. Read the prop off the component's parameter list, because `buttonClassName` has held letters that `onCompact` held in earlier releases. If Claude Code re-adds its own dialog, the `from` will need to capture whatever onClick code precedes `,onMouseEnter:`. |
| 4 (plan-mode permissions) | `extension.js` | `tool_permission_request` string. The injection site is inside `requestToolPermission`, immediately after the early-return `{behavior:"allow",updatedInput:...}` that precedes that string. That method opens with a Chrome-MCP early-return guard (`this.channels.get($)?.chromeMcpState.status==="connected"&&Q.startsWith("mcp__claude-in-chrome__")`) and, since v2.1.263, continues past the stats-helper call into an updatedPermissions block, so end the `from` string at the stats call rather than at the closing brace. Every variable is renamed in most releases, so read `channelId`, `toolName`, `inputs`, `suggestions`, `abortSignal`, the sixth options parameter, and the response local off the method itself. Whichever identifier holds `inputs` is the one the injected allow/deny check has to read. The stats helper appears twice in `extension.js`, so keep the `sendRequest` call in the `from` string for uniqueness. v2.1.274 map: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `z`=the sixth options parameter, `G`=the sendRequest response, stats helper `mc$`. The `from` string ends at `mc$(Q,G);` and the injected check reads `J`. Earlier maps are in CHANGELOG.md, entry by entry. |
| 5 (panel label) | `package.json` | `"id": "claude-sidebar"` and `"id": "claudeVSCodeSidebar"` — each followed by a `"title"` or `"name"` key |
