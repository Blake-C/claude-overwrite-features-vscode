# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Development build | `npm run compile` |
| Production build | `npm run package` |
| Watch mode | `npm run watch` |
| Package `.vsix` | `npx @vscode/vsce package` |
| Install locally | `code --install-extension claude-overwrite-features-0.6.38.vsix` |

There are no tests.

## Versioning

After any substantial change (new patch, bug fix, behavior change), bump the version in `package.json` and repackage:

1. Increment the `"version"` field in `package.json` (e.g. `0.1.0` → `0.2.0`)
2. Run `npx @vscode/vsce package` to produce the new `.vsix`
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
| 1 | Default include-file toggle to OFF | `webview/index.js` | `n1.useState(!0)` → `n1.useState(!1)` in `De1` component's `[P,_]` state |
| 2 | Strip attachments from slash commands + reset toggle | `webview/index.js` | `$.send(v1,B,l1),W([]),Nk(Q,!0)` → `$.send(v1,q1?[]:B,l1),W([]),_(!1),Nk(Q,!1)` — skips attachments for slash commands and resets `P` (includeSelection) to off after every send (v2.1.162: state-setter renamed `Mk`→`Nk`) |
| 3 | Confirm before compact | `webview/index.js` | Replaces the compact `onClick` with an inline `<dialog>` styled with VS Code CSS variables |
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
| `scripts/on-claude-update.sh` | launchd entry point. Sets up node via fnm (launchd has a bare PATH), single-run lock, diffs the newest installed version against `~/.claude/claude-overwrite-watcher.state`, runs the health check, and **only if broken** launches `claude -p` on branch `auto/patch-update-<version>` with a scoped `--allowedTools` allowlist. Guards on a clean `main`. Never touches `main`, never installs. Notifies via `osascript`. Logs to `~/Library/Logs/claude-overwrite-watcher.log`. |
| `scripts/install-watcher.sh` / `uninstall-watcher.sh` | Render `launchd/com.Blake-C.claude-overwrite-watcher.plist` (substituting `__REPO__`/`__HOME__`) into `~/Library/LaunchAgents/` and `launchctl bootstrap`/`bootout` it. |
| `launchd/…​.plist` | Template. `WatchPaths` = `~/.vscode/extensions` (fires on any extension install; the script no-ops unless the Claude Code version actually changed). |

npm scripts: `check-patches`, `watcher:install`, `watcher:uninstall`, `watcher:run`.

The headless prompt tells Claude to follow the "Finding patches after a version update" and "Navigating the Claude Code webview" sections below, edit the `from`/`to` literals in `src/patch-defs.ts`, bump version + docs, compile, package, and commit to the branch. So keep those sections accurate — the watcher depends on them.

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

### Component map (minified names, v2.1.138 — component names may change each release)

| Minified name | Role |
|---|---|
| `De1` (v2.1.204/v2.1.205: `_Qe`) | Main chat view — owns attachedFiles and includeSelection state. Signature: `function _Qe({session:e,context:t,...})` |
| `ot1` | Input/compose area (`forwardRef`) — receives attachedFiles, includeSelection, onSubmit as props |
| `xt1` | Compact/context-usage button — receives onCompact, renders the circle percentage button. Patch 3 intercepts the onClick to add the confirmation dialog. |
| `ht1` | Input footer — assembles `xt1`, the attach/mention buttons, and the send button |
| `DL0` | Include-selection toggle button in the footer |
| `hG1` | Skill tool handler class (extends `W2`) — `permissionRequest()` renders the "Use skill /name?" card including the args and description blocks |
| `No1` | Expandable/collapsible content wrapper used for user and assistant messages — takes `{content, context, maxHeight=250}`. Uses `R3.useState`/`R3.useRef`. Not used for skill cards. |

### Key variable names in the submit handler (change each release)

| Semantic role | v2.1.162 | v2.1.165 | v2.1.170 | v2.1.172 | v2.1.174 | v2.1.177 | v2.1.178 | v2.1.179 | v2.1.186 | v2.1.187 | v2.1.190 | v2.1.191 | v2.1.193 | v2.1.195 | v2.1.196 | v2.1.198 | v2.1.200 | v2.1.202 | v2.1.204 | v2.1.205 | v2.1.206 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| React namespace | `n1` | `Ye` | `Ke` | `Ke` | `Ke` | `Ke` | `je` | `je` | none (bare `oe`=useState, `Ie`=useRef) | none (bare `oe`=useState, `Ie`=useRef) | none (bare `oe`=useState, `ke`=useRef) | none (bare `oe`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ne`=useState, `ke`=useRef) | none (bare `ie`=useState, `Se`=useRef) | none (bare `ne`=useState, `Se`=useRef) | none (bare `ne`=useState, `Se`=useRef) |
| includeSelection state | `[P,_]` | `[v,x]` | `[v,x]` | `[v,x]` | `[v,x]` | `[v,x]` | `[v,x]` | `[v,x]` | `[C,x]` | `[C,x]` | `[C,x]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` |
| attachedFiles state | `[B,W]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` | `[h,p]` |
| next state after includeSelection | `[M,w]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[C,y]` | `[y,w]` | `[y,w]` | `[y,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` | `[x,w]` |
| submit callback | `C` (useCallback) | `F` (useCallback) | `F` (useCallback) | `F` (useCallback) | `F` (useCallback) | `F` (useCallback) | `F` (useCallback) | `F` (useCallback) | `H` (`Vt`/useCallback) | `H` (`Vt`/useCallback) | `H` (`Vt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) | `H` (`Wt`/useCallback) |
| command text arg | `v1` | `Oe` | `q` | `$` | `$` | `$` | `$` | `$` | `K` | `K` | `K` | `K` | `K` | `K` | `K` | `K` | `K` | `K` | `ne` | `K` | `K` |
| isSlashCommand flag | `q1` | `ae` | `De` | `De` | `De` | `De` | `De` | `De` | `Ne` | `Ne` | `Ne` | `Me` | `Ee` | `Ee` | `Ee` | `Ee` | `Ee` | `Ee` | `Je` | `De` | `De` |
| effective includeSelection | `l1` | `je` | `_t` | `gt` | `gt` | `gt` | `gt` | `gt` | `bt` | `bt` | `bt` | `bt` | `_t` | `_t` | `_t` | `_t` | `_t` | `_t` | `Dt` | `ct` | `ct` |
| compact button onCompact | `J` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` | `i` |
| scroll fn / scroll ref | `Nk` / `Q` | `IN` / `r` | `BN` / `r` | `BN` / `r` | `VN` / `r` | `VN` / `r` | `zN` / `r` | `zN` / `r` | `TM` / `r` | `DM` / `r` | `DM` / `r` | `ND` / `r` | `MD` / `r` | `PD` / `r` | `PD` / `r` | `PD` / `r` | `PD` / `r` | `PD` / `r` | `OD` / `r` | `OD` / `r` | `OD` / `r` |

**v2.1.210:** submit-handler var names are identical to v2.1.206 (command text `K`, isSlashCommand `De`, effective includeSelection `ct`, attached-files setter `p`, includeSelection reset setter `y`, scroll fn `PD` / ref `r`). The one change: `e.send` gained a fourth argument `{kind:"human"}`, so the Feature 2 site is now `await e.send(K,h,ct,{kind:"human"}),p([]),PD(r,!0)`.

**v2.1.216:** the scroll function was renamed `PD`→`OD` and the isSlashCommand local was renamed `De`→`Re`; the rest of the submit handler is unchanged (command text `K`, effective includeSelection `ct=C&&!Re`, attached files `h`, attached-files setter `p`, includeSelection reset setter `y`, scroll ref `r`). The Feature 2 site is now `await e.send(K,h,ct,{kind:"human"}),p([]),OD(r,!0)`.

**v2.1.221:** the main chat view component is `NQe` and the `useState` alias changed `ne`→`ie` (`useRef` stays `Se`), so the Feature 1 site is `_=Se(!0),[C,y]=ie(!0),[x,w]=ie(!1)`. The submit handler renamed most locals: command text `_e` (was `K`), isSlashCommand `ot` (was `Re`), effective includeSelection `Wt=C&&!ot` (was `ct`), scroll function `BD` (was `OD`). Attached files `h`, attached-files setter `p`, includeSelection reset setter `y`, and scroll ref `r` are unchanged. The Feature 2 site is now `await e.send(_e,h,Wt,{kind:"human"}),p([]),BD(r,!0)`.

**v2.1.222:** the webview is unchanged from v2.1.221 — Features 1, 2, and 3 match as-is. Only `extension.js` changed (see the Feature 4 row below).

**v2.1.223:** the webview is unchanged from v2.1.221/v2.1.222 — Features 1, 2, and 3 match as-is. Only `extension.js` changed (see the Feature 4 row below).

**v2.1.224:** the webview is unchanged from v2.1.221 through v2.1.223 — Features 1, 2, and 3 match as-is. Only `extension.js` changed (see the Feature 4 row below).

**v2.1.226:** the main chat view component is `tJe` and the `useRef` alias changed `Se`→`we` (`useState` stays `ie`), so the Feature 1 site is `_=we(!0),[C,y]=ie(!0),[x,w]=ie(!1)`. The submit handler (`et`, via `Vt`/useCallback) no longer assigns the command text to a separate local — it uses the callback argument `ve` directly. isSlashCommand is `_t` (was `ot`), effective includeSelection is `bt=C&&!_t` (was `Wt`), and the scroll function is `HD` (was `BD`). Attached files `h`, attached-files setter `p`, includeSelection reset setter `y`, and scroll ref `r` are unchanged. The Feature 2 site is now `await e.send(ve,h,bt,{kind:"human"}),p([]),HD(r,!0)`. Feature 3 is unchanged.

**v2.1.228:** the main chat view component is `not` and the `useRef` alias changed `we`→`_e` (`useState` stays `ie`). The includeSelection state pair is now `[C,x]` (the setter was `y`) and the following state pair is `[y,w]`, so the Feature 1 site is `_=_e(!0),[C,x]=ie(!0),[y,w]=ie(!1)`. The submit handler is `Dr` (via `zt`/useCallback) and uses its callback argument `xe` directly for the command text (was `ve`). isSlashCommand is `Lt` (was `_t`), effective includeSelection is `jt=C&&!Lt` (was `bt`), and the scroll function is `kN` (was `HD`). Attached files `h`, attached-files setter `p`, and scroll ref `r` are unchanged; the includeSelection reset setter is now `x`. The Feature 2 site is now `await e.send(xe,h,jt,{kind:"human"}),p([]),kN(r,!0)`. Feature 3 is unchanged.

**v2.1.229:** the main chat view component is `Bot`, the `useRef` alias changed `_e`→`ge`, and the `useState` alias changed `ie`→`ne`, so the Feature 1 site is `_=ge(!0),[C,x]=ne(!0),[y,w]=ne(!1)` (the includeSelection state pair stays `[C,x]`). The submit handler still uses its callback argument directly for the command text, now `ve` (was `xe`). isSlashCommand is `rt` (was `Lt`), effective includeSelection is `Vt=C&&!rt` (was `jt`), and the scroll function is `EN` (was `kN`). Attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The Feature 2 site is now `await e.send(ve,h,Vt,{kind:"human"}),p([]),EN(r,!0)`. Feature 3 is unchanged.

**v2.1.232:** the Feature 1 site is unchanged from v2.1.229 (`_=ge(!0),[C,x]=ne(!0),[y,w]=ne(!1)`), though the main chat view component is now `Uot`. The submit handler is `zo` (via `Ut`/useCallback) and still uses its callback argument `ve` directly for the command text. isSlashCommand is `st` (was `rt`), effective includeSelection is still `Vt=C&&!st`, and the scroll function is `TN` (was `EN`). Attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The Feature 2 site is now `await e.send(ve,h,Vt,{kind:"human"}),p([]),TN(r,!0)`. Feature 3 is unchanged.

**v2.1.233:** the webview is unchanged from v2.1.232 — Features 1, 2, and 3 match as-is. Only `extension.js` changed (see the Feature 4 row below).

**v2.1.234:** the webview is unchanged from v2.1.232/v2.1.233 — Features 1, 2, and 3 match as-is. Only `extension.js` changed (see the Feature 4 row below).

### Key functions

| Function | What it does |
|---|---|
| `VB1($,Z,J,...)` | Builds the message content array. `J` = IDE context (`{filePath, selectedText, startLine, endLine}`), `Z` = attached files. Injects `<ide_opened_file>` or `<ide_selection>` tags. |
| `YB1($,Z)` | Creates a compact message object: `new kz("compact",[],{compactMetadata:{trigger:$,preTokens:Z}})` |
| `F` (in main chat view, v2.1.165) | The `useCallback` submit handler. Key locals: `ae` = isSlashCommand, `h` = attached files, `je = v&&!ae` (include-selection effective value). Calls `e.send(Oe,h,je)` then `p([])` to clear files. |

### Data flow for message submission

```
User types → ot1 input → k1() (on Enter) → J(text) → C(text) in De1
  C builds: e1 (slash?), k5 (includeSelection), then calls $.send(text, B, k5)
  $.send → VB1 adds ide_opened_file/selection context + file attachments → sends to Claude CLI
  After send: W([]) clears attached files, _(!1) resets includeSelection toggle [Patch 2/6]
```

### Compact flow

```
User clicks compact button (xt1) → onClick:J [unpatched: direct call]
  [Patch 3 intercepts onClick] → <dialog> modal → user confirms → J() (onCompact in xt1)
  → onCompact:z in ht1 → onCompact:Y0 in ot1 → Y0() → J("/compact") (onSubmit)
  → C("/compact") in De1 → e1=true → k5=false, B replaced with [] [Patch 2] → $.send("/compact",[],false)
```

Note: Prior to v2.1.138, Claude Code itself rendered a `<dialog>` on compact with no VS Code styling. As of v2.1.138 that dialog was removed — Patch 3 now builds the entire dialog from scratch.

### Finding patches after a version update

Search for stable string literals near the patch site rather than variable names (which change):

| Patch | File | Stable anchor to search for |
|---|---|---|
| 1 (includeSelection default) | `webview/index.js` | `"selectionLabel"` CSS class string nearby, or the main chat view component signature (v2.1.204: `function _Qe({session:`; component name changes each release). The three consecutive `useState` calls are `_=_e(!0),[C,x]=ie(!0),[y,w]=ie(!1)` (v2.1.204 used `ie`; v2.1.205 through v2.1.217 used `ne`; v2.1.221 onward is back to `ie`; the leading `useRef` alias was `Se` through v2.1.224, `we` in v2.1.226, `_e` in v2.1.228, and `ge` in v2.1.229; the `useState` alias is `ne` again in v2.1.229 and stays `ne` in v2.1.232) — flip the middle state pair's init from `!0` to `!1` (that pair was `[C,y]` through v2.1.226 and is `[C,x]` from v2.1.228 on) |
| 2 (attachments + slash) | `webview/index.js` | `"remote-control"` or `"/rc"` string in the same `if` block |
| 3 (compact confirm) | `webview/index.js` | `click to compact\`` in the button's `title` attribute — patch site is `onClick:i,onMouseEnter:` (replace `onClick:i` with the dialog). If Claude Code re-adds its own dialog, the `from` will need to capture whatever onClick code precedes `,onMouseEnter:`. |
| 4 (plan-mode permissions) | `extension.js` | `tool_permission_request` string — the injection site is immediately after the first early-return `{behavior:"allow",updatedInput:...}` before that string. Variable names change each release; check `inputs`, `channelId`, `suggestions`, `abortSignal`, and `result` vars. v2.1.158 map: `z`=channelId, `V`=toolName, `N`=inputs, `B`=suggestions, `K`=abortSignal, `Z`=result, `U80`=stats helper. v2.1.162 map: `z`=channelId, `V`=toolName, `B`=inputs, `N`=suggestions, `K`=abortSignal, `Z`=result, `E80`=stats helper. v2.1.165 map: `e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `o`=result, `Tse`=stats helper. Function ends with `return Tse(t,o),o.result}` — include this in the `from` string for uniqueness. v2.1.167 map: identical to v2.1.165 except stats helper renamed `Tse`→`Rse`; function ends with `return Rse(t,o),o.result}`. v2.1.170 map: identical to v2.1.165/v2.1.167 variable names; stats helper renamed `Rse`→`Ase`; function ends with `return Ase(t,o),o.result}`. v2.1.172 map: identical to v2.1.170 except stats helper renamed `Ase`→`Mse`; function ends with `return Mse(t,o),o.result}`. v2.1.174 map: identical to v2.1.172 except stats helper renamed `Mse`→`Lse`; function ends with `return Lse(t,o),o.result}`. v2.1.177 map: identical to v2.1.174 except stats helper renamed `Lse`→`noe`; function ends with `return noe(t,o),o.result}`. v2.1.178 map: identical to v2.1.177 except stats helper renamed `noe`→`aoe`; function ends with `return aoe(t,o),o.result}`. v2.1.179 map: identical to v2.1.178 except stats helper renamed `aoe`→`coe`; function ends with `return coe(t,o),o.result}`. v2.1.183 map: identical to v2.1.179 except stats helper renamed `coe`→`moe`; function ends with `return moe(t,o),o.result}`. v2.1.186 map: identical to v2.1.183 except stats helper renamed `moe`→`boe`; function ends with `return boe(t,o),o.result}`. v2.1.187 map: identical to v2.1.186 except stats helper renamed `boe`→`Eoe`; function ends with `return Eoe(t,o),o.result}`. v2.1.191 map: identical to v2.1.187 except stats helper renamed `Eoe`→`Poe`; function ends with `return Poe(t,o),o.result}`. v2.1.193 map: identical to v2.1.191 except stats helper renamed `Poe`→`Noe`; function ends with `return Noe(t,o),o.result}`. v2.1.196 map: identical to v2.1.193 except stats helper renamed `Noe`→`Loe`; function ends with `return Loe(t,o),o.result}`. v2.1.198 map: identical to v2.1.196 except stats helper renamed `Loe`→`lae`; function ends with `return lae(t,o),o.result}`. v2.1.200 map: identical to v2.1.198 except stats helper renamed `lae`→`fae`; function ends with `return fae(t,o),o.result}`. v2.1.202 map: identical to v2.1.200 except stats helper renamed `fae`→`Bce`; function ends with `return Bce(t,o),o.result}`. v2.1.204 map: the early-return guard changed to a Chrome-MCP check (`this.channels.get(e)?.chromeMcpState.status==="connected"&&t.startsWith("mcp__claude-in-chrome__")`) and the result var was renamed `o`→`s`; stats helper stays `Bce`; function ends with `return Bce(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result. v2.1.205 map: identical to v2.1.204 (same Chrome-MCP guard, same vars) except stats helper renamed `Bce`→`Wce`; function ends with `return Wce(t,s),s.result}`. v2.1.206 map: identical to v2.1.205 (same Chrome-MCP guard, same vars) except stats helper renamed `Wce`→`Kle`; function ends with `return Kle(t,s),s.result}`. v2.1.207 map: identical to v2.1.206 (same Chrome-MCP guard, same vars) except stats helper renamed `Kle`→`uue`; function ends with `return uue(t,s),s.result}`. v2.1.208 map: same Chrome-MCP guard, but the `sendRequest` call swapped the `suggestions`/`abortSignal` argument names — suggestions is now `n` and abortSignal is `i` (`suggestions:n},i`) — and the stats helper was renamed `uue`→`xue`; function ends with `return xue(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.210 map: same Chrome-MCP guard, but the `sendRequest` argument names reverted to `suggestions:i},n` (suggestions is `i`, abortSignal is `n` again) and the stats helper was renamed `xue`→`Sue`; function ends with `return Sue(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result. v2.1.211 map: same Chrome-MCP guard, but the `sendRequest` argument names reverted again to `suggestions:n},i` (suggestions is `n`, abortSignal is `i`, matching v2.1.208) and the stats helper was renamed `Sue`→`Rue`; function ends with `return Rue(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.212 map: identical to v2.1.211 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `Rue`→`M_e`; function ends with `return M_e(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.214 map: identical to v2.1.212 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `M_e`→`W_e`; function ends with `return W_e(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.216 map: identical to v2.1.214 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `W_e`→`V_e`; function ends with `return V_e(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.217 map: identical to v2.1.216 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `V_e`→`J_e`; function ends with `return J_e(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.221 map: identical to v2.1.217 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `J_e`→`Q_e`; function ends with `return Q_e(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.222 map: identical to v2.1.221 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `Q_e`→`fve`; function ends with `return fve(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.223 map: identical to v2.1.222 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `fve`→`Ave`; function ends with `return Ave(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.224 map: identical to v2.1.223 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `Ave`→`Yfe`; function ends with `return Yfe(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.226 map: identical to v2.1.224 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `Yfe`→`Sme`; function ends with `return Sme(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.228 map: identical to v2.1.226 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `Sme`→`_Ce`; function ends with `return _Ce(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.229 map: identical to v2.1.228 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `_Ce`→`OTe`; function ends with `return OTe(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.232 map: identical to v2.1.229 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `OTe`→`XTe`; function ends with `return XTe(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.233 map: identical to v2.1.232 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `XTe`→`nAe`; function ends with `return nAe(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. v2.1.234 map: identical to v2.1.233 (same Chrome-MCP guard, same `suggestions:n},i` argument order, same vars) except the stats helper was renamed `nAe`→`IAe`; function ends with `return IAe(t,s),s.result}`. Vars: `e`=channelId, `t`=toolName, `r`=inputs, `n`=suggestions, `i`=abortSignal, `s`=result. |
| 5 (panel label) | `package.json` | `"id": "claude-sidebar"` and `"id": "claudeVSCodeSidebar"` — each followed by a `"title"` or `"name"` key |
