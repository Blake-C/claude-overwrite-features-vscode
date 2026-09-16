# Changelog

## [0.7.2] - 2026-09-16

Updated the Feature 2 and Feature 4 patch strings for Claude Code v2.1.273. Features 1, 3, and 5 were unaffected.

The output channel reported Features 2, 3, and 4 as "pattern not found" on v2.1.273. Feature 3 was reported broken because the installed build of this extension was 0.7.0, whose compact-button string targets v2.1.270, so installing 0.7.1 fixed Feature 3 with no string change.

v2.1.273 keeps the minifier from v2.1.245, and every change in this release is a rename. The main chat view is `Nq0` (was `pH0`), the compact button component is `f25` (was `b25`) inside the wrapper `uz0`, and the selection chip is `x25` (was `a75`) with its label helper `y25`.

- Feature 1: `applySelectionUpdate` is unchanged and its parameter is still `$`, so the v0.7.0 strings match as-is
- Feature 2: the submit handler is `V5` (via `z0`/useCallback) and still uses its callback argument `z1` for the command text. isSlashCommand is `r` (was `i`) and the selection flag is `w1=!r` (was `r=!i`). Attached files `W` with setter `B` and the scroll function `hy` with ref `Q` are unchanged. The site is now `await $.send(z1,W,w1,{kind:"human"}),B([]),hy(Q,!0)`. The handler's `catch(r)` shadows `r`, and `z1`, `r`, and `w1` are each reused elsewhere in the component, so the `from` string matches the full send call
- Feature 3: the compact button component was renamed `b25`→`f25`, but its props are still `{percentageUsed:$,onCompact:J,buttonClassName:Z}`, so `onCompact` is still `J` and both halves of the `to` string match as-is
- Feature 4: the Chrome-MCP early-return guard, the restructured tail from v2.1.263, and the sixth parameter `z` added in v2.1.268 are all unchanged. The `sendRequest` response local was renamed `K`→`G` and the stats helper `fh$`→`dh$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `G`=response. The injected allow/deny check still reads `J` for the tool inputs. `dh$` appears twice in `extension.js`, so the `from` string keeps the `sendRequest` call for uniqueness

Each of the four code `from` strings was checked against the installed files and appears exactly once. They were also checked against the pristine `.backup` copies, because the live `webview/index.js` already had Features 1 and 3 applied when the check ran.

## [0.7.1] - 2026-09-15

Updated the Feature 2, 3, and 4 patch strings for Claude Code v2.1.272. Features 1 and 5 were unaffected this time.

v2.1.272 keeps the minifier from v2.1.245, and every change in this release is a rename. Feature 3 moved for the second time since v2.1.245, because the compact button's `onCompact` and `buttonClassName` props swapped names.

- Feature 1: `applySelectionUpdate` is unchanged and its parameter is still `$`, so the v0.7.0 strings match as-is
- Feature 2: the submit handler is `V5` (via `Q0`/useCallback) and uses its callback argument `z1` for the command text (was `q1`). isSlashCommand is `i` (was `t`), the selection flag is `r=!i` (was `n=!t`), and the scroll function was renamed `my`→`hy`. Attached files `W` with setter `B` and scroll ref `Q` are unchanged. The site is now `await $.send(z1,W,r,{kind:"human"}),B([]),hy(Q,!0)`. `z1`, `i`, and `r` are each reused several times in this component, so the `from` string matches the full send call
- Feature 3: the compact button component is `b25` and its props are `{percentageUsed:$,onCompact:J,buttonClassName:Z}`, so `onCompact` is `J` and `Z` is now `buttonClassName`. Both halves of the `to` string changed: the `onClick:` value and the dialog's confirm branch, which calls `J()`. Leaving the confirm branch on `Z` would have compiled and produced a dialog whose Compact button does nothing
- Feature 4: the Chrome-MCP early-return guard and the restructured tail from v2.1.263 are unchanged, and `requestToolPermission` still takes the sixth parameter `z` added in v2.1.268. toolName and inputs swapped names back, suggestions shifted, and the stats helper was renamed `pu$`→`fh$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `K`=response. The injected allow/deny check reads `J` for the tool inputs, where v2.1.270 read `X`. `fh$` appears twice in `extension.js`, so the `from` string keeps the `sendRequest` call for uniqueness

Each of the four code `from` strings was checked against the installed files and appears exactly once.

## [0.7.0] — 2026-09-13

Feature 1 works again on Claude Code v2.1.270. Option 3 of the three replacements listed in the v0.6.56 entry was chosen, so the patch now sends a selection only when there is one.

The patch moved out of the chat view and into the session class. It appends `?.selectedText?$:void 0` to the assignment at the tail of `applySelectionUpdate`, so the session stores a selection only when that selection carries `selectedText`:

- `from`: `this.dismissedSelection=void 0,this.selection.value=$`
- `to`: `this.dismissedSelection=void 0,this.selection.value=$?.selectedText?$:void 0`

Having a file open attaches nothing and shows no chip. Selecting text in the editor shows the chip and sends the selection. The chip's X still calls `dismissSelection()`.

The patch name changed from "Feature 1: Default include-file toggle to OFF" to "Feature 1: Send only a real selection, not the open file", which is what the output channel and `npm run check-patches` now print.

Two things about the new strings were checked against `src/patch-defs.ts`:

- The `from` string is a prefix of the `to` string, so a patched file contains both. `applyPatch` tests `content.includes(patch.to)` before it tests `from` and returns `alreadyPatched` without rewriting, and `revertPatch` looks for `to` only, so neither one double-applies. This patch reports "pattern not found" when the anchor text changes, which covers both a restructured `applySelectionUpdate` and a renamed parameter.
- `applyPatch` calls `content.replace`, which rewrites the first occurrence only. The anchor occurs once in v2.1.270's `webview/index.js`.

This release also drops the "Not working on Claude Code v2.1.270 and later" warning from `README.md`.

## [0.6.56] — 2026-09-13

Updated the Feature 2 and 4 patch strings for Claude Code v2.1.270. Features 3 and 5 were unaffected this time. Feature 1 has no patch site in this release, so its v2.1.268 strings are left in place and the health check keeps reporting it as broken.

v2.1.270 keeps the minifier from v2.1.245, but the webview change is not a rename. Claude Code removed the include-selection toggle button from the chat footer and replaced it with a chip that shows the current file and has an X to dismiss it, so the state Feature 1 flipped and the setter Feature 2 called are both gone.

- Feature 1: the main chat view is `pH0`, with `U1` as the `useRef` alias and `l` as the `useState` alias, and it no longer holds an includeSelection state. The footer component `QH0` takes `currentSelection` and `onRemoveSelection` in place of the toggle, and renders the chip component `a75`, whose title reads `Showing Claude your current file selection (...)` and whose X button calls `session.dismissSelection()`. The submit handler computes the selection flag as `let n=!t`, where `t` is the isSlashCommand local, so the current file is sent with every message that is not a slash command. There is no `useState(!0)` left to flip to `!1`. Three ways to restore the behavior are listed below
- Feature 2: the submit handler is `W5` (via `H0`/useCallback) and uses its callback argument `q1` for the command text. isSlashCommand is `t`, the selection flag is `n=!t`, attached files are `W` with setter `B`, and the scroll function is `my` with ref `Q`. The site is now `await $.send(q1,W,n,{kind:"human"}),B([]),my(Q,!0)`. The reset half of the patch is dropped, because there is no toggle setter left to call and `send()` already skips a selection that matches `lastSentSelection` from the previous message
- Feature 4: the Chrome-MCP early-return guard and the restructured tail from v2.1.263 are unchanged, but toolName, inputs, and suggestions shifted position. Vars: `$`=channelId, `Q`=toolName, `X`=inputs, `J`=suggestions, `Y`=abortSignal, `z`=the sixth options parameter, `K`=response, stats helper `pu$`. The `from` string ends at `pu$(Q,K);`. `pu$` appears twice in `extension.js`, so the `from` string keeps the `sendRequest` call for uniqueness

### Feature 1 options for v2.1.270

Each option below was checked against the installed `webview/index.js`, and each anchor string appears exactly once. None of them reproduce the old behavior, which was a toggle that started off and could be switched back on for a single message.

1. Send nothing. Change `let n=!t` to `let n=!1`. The chip still renders and its title still says Claude is being shown the current file, while nothing is sent.
2. Send nothing and remove the chip. Do option 1, and also drop `Y&&F(a75,{currentSelection:Y,onRemove:G})` from the footer. The footer then matches what is sent, and there is no way to include the current file in a message.
3. Send only a real selection. Change the tail of `applySelectionUpdate` from `this.dismissedSelection=void 0,this.selection.value=$` to `this.dismissedSelection=void 0,this.selection.value=$?.selectedText?$:void 0`. Having a file open attaches nothing and shows no chip, selecting text in the editor shows the chip and sends it, and the X button still dismisses it.

### Packaging and watcher notifications

The v0.6.56 patch-string update above added the first relative link to `README.md`, a link to this file, and `vsce` rewrites relative links into absolute URLs using the `repository` field in `package.json`. That field had never been set, so `npm run vsix` failed with "Couldn't detect the repository where this extension is published". `package.json` now sets `repository` to the `origin` remote in https form, and the packaged README links to `https://github.com/Blake-C/claude-overwrite-features-vscode/blob/HEAD/CHANGELOG.md`.

The watcher runs `npm run vsix` itself, so it hit the same failure and reported only "the .vsix failed to build". Two changes to `scripts/on-claude-update.sh` fix what the notification says and what clicking it does:

- The packaging step captures the output of `npm run vsix` instead of appending it straight to the log, and the failure notification now carries the first line of that output containing "error", trimmed to 150 characters. The full output still goes to the log.
- `notify()` posts through `terminal-notifier` when it is installed, passing `-execute "open -R '$LOG_FILE'"` so clicking the notification reveals `~/Library/Logs/claude-overwrite-watcher.log` in Finder. The old `osascript` call is the fallback, and clicking one of its notifications opens Script Editor.

## [0.6.55] — 2026-09-11

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.268. Features 3 and 5 were unaffected this time.

v2.1.268 keeps the minifier from v2.1.245. In the webview the `useRef` alias changed and the submit handler renamed every local it uses. In the extension `requestToolPermission` gained a sixth parameter that is spread into the `sendRequest` payload.

- Feature 1: the main chat view is `JU0`, the `useRef` alias changed `G1`→`X1`, and the `useState` alias stays `n`. The leading `useRef` local stays `_`. The includeSelection state pair is `[L,E]` (the setter was `b`) and the pair that follows it is `[k,h]` (was `[f,h]`). The site is now `_=X1(void 0),[L,E]=n(!0),[k,h]=n(!1)`
- Feature 2: the submit handler is `T8` (via `q0`/useCallback) and uses its callback argument `D1` for the command text (was `W1`). isSlashCommand is `Y0` (was `W0`), effective includeSelection is `R0=L&&!Y0` (was `M0`), the scroll function was renamed `Ih`→`oh`, and the includeSelection reset setter is `E` (was `b`). Attached files `W` with setter `B` and scroll ref `Q` are unchanged. The site is now `await $.send(D1,W,R0,{kind:"human"}),B([]),oh(Q,!0)`
- Feature 4: the Chrome-MCP early-return guard and the restructured tail from v2.1.263 are unchanged, but `requestToolPermission` now takes a sixth parameter `z` that is spread into the `sendRequest` payload as `suggestions:X,...z`. The response local was renamed `W`→`K` and the stats helper `$b$`→`Tg$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `K`=response. `Tg$` appears twice in `extension.js`, so the `from` string keeps the `sendRequest` call for uniqueness

## [0.6.54] — 2026-09-09

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.266. Features 3 and 5 were unaffected this time.

v2.1.266 keeps the minifier from v2.1.245. In the webview the `useState` alias changed and two locals in the submit handler were renamed. In the extension the `requestToolPermission` parameters shifted position again.

- Feature 1: the main chat view is `Hz0`, the `useRef` alias stays `G1`, and the `useState` alias changed `s`→`n`. The leading `useRef` local stays `_`. The includeSelection state pair stays `[L,b]` and the pair that follows it is `[f,h]` (was `[k,h]`). The site is now `_=G1(void 0),[L,b]=n(!0),[f,h]=n(!1)`
- Feature 2: the submit handler is `t5` (via `U0`/useCallback) and still uses its callback argument `W1` for the command text. isSlashCommand stays `W0`, effective includeSelection is `M0=L&&!W0` (was `j0`), and the scroll function was renamed `bh`→`Ih`. Attached files `W` with setter `B`, includeSelection reset setter `b`, and scroll ref `Q` are unchanged. The site is now `await $.send(W1,W,M0,{kind:"human"}),B([]),Ih(Q,!0)`
- Feature 4: the Chrome-MCP early-return guard and the restructured tail from v2.1.263 are unchanged, but toolName and inputs swapped names again, abortSignal was renamed `z`→`Y`, and the stats helper was renamed `_S$`→`$b$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=response. The `from` string still ends at the stats call, now `$b$(Q,W);`

## [0.6.53] — 2026-09-07

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.263. Features 3 and 5 were unaffected this time.

v2.1.263 keeps the minifier from v2.1.245, but the webview's identifier pool shifted back toward short lowercase names and the extension's `requestToolPermission` was restructured.

- Feature 1: the main chat view is `$z0`, the `useRef` alias is `G1`, and the `useState` alias is `s`. The includeSelection state pair is `[L,b]` and the pair that follows it is `[k,h]`. Other hooks now sit between the leading `useRef` call and the state pairs, so the anchor is the `useRef` local `_` that immediately precedes them. The site is now `_=G1(void 0),[L,b]=s(!0),[k,h]=s(!1)`
- Feature 2: the submit handler is `o5` (via `U0`/useCallback) and uses its callback argument `W1` for the command text. isSlashCommand is `W0`, effective includeSelection is `j0=L&&!W0`, attached files are `W` with setter `B`, the includeSelection reset setter is `b`, and the scroll function is `bh` with ref `Q`. The site is now `await $.send(W1,W,j0,{kind:"human"}),B([]),bh(Q,!0)`
- Feature 4: the Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged. Vars: `$`=channelId, `J`=toolName, `Q`=inputs, `X`=suggestions, `z`=abortSignal, `W`=response, stats helper `_S$`. The function no longer ends at the stats call. It now reads `_S$(J,W);let K=W.result;...` and continues into an updatedPermissions block, so the `from` string ends at `_S$(J,W);` instead of at the closing brace

## [0.6.52] — 2026-09-04

Updated the Feature 1, 2, 3, and 4 patch strings for Claude Code v2.1.260, and changed the watcher so a failed auto-fix run is retried instead of being recorded as handled.

v2.1.260 keeps the minifier from v2.1.245. Feature 3 moved for the first time since v2.1.245: the compact button's `onCompact` prop was renamed, and the identifier appears twice in that patch, so both the `onClick:` match and the dialog's confirm branch had to change.

- Feature 1: the main chat view is `$G0`, the `useRef` alias stays `H1`, and the `useState` alias changed `Y1`→`$1`. The leading `useRef` local is `P` (was `j`). The includeSelection state pair is `[w,N]` (was `[M,_]`) and the pair that follows it is `[M,O]`. The site is now `P=H1(!0),[w,N]=$1(!0),[M,O]=$1(!1)`
- Feature 2: the submit handler is `_7` (via `H0`/useCallback) and still uses its callback argument `a` for the command text. isSlashCommand is `O1` (was `R1`), effective includeSelection is `l1=w&&!O1`, the scroll function was renamed `fy`→`Ph`, the scroll ref is `Q` (was `Z`), and the includeSelection reset setter is `N` (was `_`). Attached files `B` with setter `W` are unchanged. The site is now `await $.send(a,B,l1,{kind:"human"}),W([]),Ph(Q,!0)`
- Feature 3: the compact button component is `HQ0` and its `onCompact` prop is `Z` (was `Y`, which is now `buttonClassName`). The site is `click to compact\`,onClick:Z,onMouseEnter:` and the dialog's confirm branch now calls `Z()`
- Feature 4: the Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged, but the result local was renamed `K`→`W` and the stats helper `Q_$`→`K_$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `z`=abortSignal. The function now ends `return K_$(Q,W),W.result}`

The watcher change fixes a gap this update exposed. `scripts/on-claude-update.sh` wrote the version to `~/.claude/claude-overwrite-watcher.state` before checking the `claude -p` exit code, so when the v2.1.260 run died on an expired OAuth session it still recorded the version as handled and would never have retried. The state file is now written only after a successful run. A failure increments a per-version counter in `~/.claude/claude-overwrite-watcher.attempts` and leaves the state file alone, so the next filesystem event retries. After three failed attempts on the same version the watcher logs, notifies, and stops trying.

## [0.6.51] — 2026-09-03

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.259. Features 3 and 5 were unaffected this time.

v2.1.259 keeps the minifier from v2.1.245. The webview's `useState` alias reverted to `Y1`, the whole submit handler was renamed, and in the extension the `requestToolPermission` parameters shifted position again.

- Feature 1: the main chat view is `NJ0`, the `useRef` alias stays `H1`, and the `useState` alias changed `J1`→`Y1`. The leading `useRef` local stays `j`. The includeSelection state pair stays `[M,_]` and the pair that follows it is `[w,R]` (the setter was `O`). The site is now `j=H1(!0),[M,_]=Y1(!0),[w,R]=Y1(!1)`
- Feature 2: the submit handler is `p7` (via `z0`/useCallback) and still uses its callback argument `a` for the command text. isSlashCommand is `R1` (was `N1`), effective includeSelection is `l1=M&&!R1`, and the scroll function was renamed `Py`→`fy`. Attached files `B` with setter `W`, includeSelection reset setter `_`, and scroll ref `Z` are unchanged. The site is now `await $.send(a,B,l1,{kind:"human"}),W([]),fy(Z,!0)`
- Feature 4: the Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged, but abortSignal and the result local were renamed and the stats helper was renamed `ST$`→`Q_$`. Vars: `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `z`=abortSignal, `K`=result. The function now ends `return Q_$(Q,K),K.result}`

## [0.6.50] — 2026-09-02

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.257. Features 3 and 5 were unaffected this time.

v2.1.257 keeps the minifier from v2.1.245. The webview's `useRef`/`useState` aliases and the whole submit handler were renamed, and in the extension the `requestToolPermission` parameters shifted position.

- Feature 1: the main chat view is `ZJ0`, the `useRef` alias changed `D1`→`H1`, and the `useState` alias changed `Y1`→`J1`. The leading `useRef` local is `j` (was `D`). The includeSelection state pair stays `[M,_]` and the pair that follows it stays `[w,O]`. The site is now `j=H1(!0),[M,_]=J1(!0),[w,O]=J1(!1)`
- Feature 2: the submit handler is `x6` (via `H0`/useCallback) and uses its callback argument `a` for the command text (was `g`). isSlashCommand is `N1` (was `Q1`), effective includeSelection is `l1=M&&!N1` (was `q1`), and the scroll function was renamed `Jy`→`Py`. Attached files `B` with setter `W`, includeSelection reset setter `_`, and scroll ref `Z` are unchanged. The site is now `await $.send(a,B,l1,{kind:"human"}),W([]),Py(Z,!0)`
- Feature 4: the Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged, but toolName and inputs swapped names and the stats helper was renamed `Cw0`→`ST$`. Vars: `$`=channelId, `J`=toolName, `Q`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=result. The function now ends `return ST$(J,W),W.result}`

## [0.6.49] — 2026-08-30

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.251. Features 3 and 5 were unaffected this time.

v2.1.251 keeps the minifier from v2.1.245. The webview submit handler and the includeSelection state pair both had names shuffled, and the extension's stats helper was renamed again.

- Feature 1: the includeSelection state pair is now `[M,_]` (the setter was `w`) and the pair that follows it is `[w,O]`. The `useRef` alias `D1` and the `useState` alias `Y1` are unchanged. The site is now `D=D1(!0),[M,_]=Y1(!0),[w,O]=Y1(!1)`
- Feature 2: the submit handler is `j4` (via `p0`/useCallback) and uses its callback argument `g` for the command text (was `a`). Effective includeSelection is `q1=M&&!Q1` (was `I1`), the scroll function was renamed `$y`→`Jy`, and the includeSelection reset setter is `_` (was `w`). isSlashCommand `Q1`, attached files `B` with setter `W`, and scroll ref `Z` are unchanged. The site is now `await $.send(g,B,q1,{kind:"human"}),W([]),Jy(Z,!0)`
- Feature 4: the stats helper was renamed `Fw$`→`Cw0`. The Chrome-MCP early-return guard, the `sendRequest` argument order, and every variable name (`$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=result) are unchanged. The function now ends `return Cw0(Q,W),W.result}`

## [0.6.48] — 2026-08-28

Updated the Feature 4 patch string for Claude Code v2.1.250. Features 1, 2, 3, and 5 were unaffected this time.

v2.1.250 keeps the minifier from v2.1.245, and `requestToolPermission` is otherwise byte-identical to v2.1.247. The Chrome-MCP early-return guard, the `sendRequest` argument order, and every variable name (`$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=result) are unchanged.

- Feature 4: the stats helper was renamed `wj$`→`Fw$`. The function now ends `return Fw$(Q,W),W.result}`

## [0.6.47] — 2026-08-27

Updated the Feature 4 patch string for Claude Code v2.1.247. Features 1, 2, 3, and 5 were unaffected this time.

v2.1.247 keeps the minifier from v2.1.245, and `requestToolPermission` is otherwise byte-identical to v2.1.246. The Chrome-MCP early-return guard, the `sendRequest` argument order, and every variable name (`$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=result) are unchanged.

- Feature 4: the stats helper was renamed `jA$`→`wj$`. The function now ends `return wj$(Q,W),W.result}`

## [0.6.46] — 2026-08-27

Updated the Feature 2 and 4 patch strings for Claude Code v2.1.246. Features 1, 3, and 5 were unaffected this time.

v2.1.246 keeps the minifier introduced in v2.1.245, so the `$`/`J`/`X`/`Y`/`Q`/`W` identifier style still holds. Only two names moved.

- Feature 2: the scroll function was renamed `tk`→`$y`. The command text `a`, isSlashCommand `Q1`, effective includeSelection `I1=M&&!Q1`, attached files `B` with setter `W`, includeSelection reset setter `w`, and scroll ref `Z` are unchanged. The site is now `await $.send(a,B,I1,{kind:"human"}),W([]),$y(Z,!0)`
- Feature 4: every variable in `requestToolPermission` shifted one position and the stats helper was renamed `iA0`→`jA$`. Vars are now `$`=channelId, `Q`=toolName, `J`=inputs, `X`=suggestions, `Y`=abortSignal, `W`=result. The Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged. The function now ends `return jA$(Q,W),W.result}`

## [0.6.45] — 2026-08-25

Updated the Feature 1, 2, 3, and 4 patch strings for Claude Code v2.1.245. Feature 5 was unaffected.

v2.1.245 switched minifiers. Identifiers are now `$`, `J`, `X`, `Y`, `Q`, `Z`, `W` and suffixed names like `D1`, `Y1`, `tk`, instead of the `e`/`t`/`r`/`ie`/`_e` style used since v2.1.162. Every webview and extension patch site changed as a result, so expect no name to carry over from the tables above.

- Feature 1: the main chat view component is `b30`, the `useRef` alias is `D1`, and the `useState` alias is `Y1`. The includeSelection state pair is `[M,w]`, so the site is now `D=D1(!0),[M,w]=Y1(!0),[_,O]=Y1(!1)`
- Feature 2: the submit handler is `j4` (via `v0`/useCallback) and uses its callback argument `a` for the command text. The session object is `$` (was `e`), isSlashCommand is `Q1`, effective includeSelection is `I1=M&&!Q1`, attached files are `B` with setter `W`, the includeSelection reset setter is `w`, and the scroll function is `tk` with ref `Z`. The site is now `await $.send(a,B,I1,{kind:"human"}),W([]),tk(Z,!0)`
- Feature 3: the compact button component is `c90` and its `onCompact` prop is `Y` (was `i`), so the site is `click to compact\`,onClick:Y,onMouseEnter:`. The dialog's confirm branch calls `Y()`
- Feature 4: the Chrome-MCP early-return guard and the `sendRequest` argument order are unchanged, but every variable was renamed: `$`=channelId, `J`=toolName, `X`=inputs, `Y`=suggestions, `Q`=abortSignal, `W`=result, and the stats helper is `iA0`. The function now ends `return iA0(J,W),W.result}`

## [0.6.44] — 2026-08-23

Updated the Feature 1 and 2 patch strings for Claude Code v2.1.241. Features 3, 4, and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `me`→`_e` and the `useState` alias changed `te`→`ie`, so the site is back to `_=_e(!0),[C,x]=ie(!0),[y,w]=ie(!1)`. The includeSelection state pair stays `[C,x]`. The main chat view component is `bct`
- Feature 2: the submit handler is `xr` (via `Bt`/useCallback) and uses its callback argument `K` for the command text (was `H`). isSlashCommand is `oe` (was `ne`), effective includeSelection is `Re=C&&!oe` (was `le`), and the scroll function was renamed `HN`→`XN`. Attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The site is now `await e.send(K,h,Re,{kind:"human"}),p([]),XN(r,!0)`

## [0.6.43] — 2026-08-22

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.239. Features 3 and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `_e`→`me` and the `useState` alias changed `ie`→`te`, so the site is now `_=me(!0),[C,x]=te(!0),[y,w]=te(!1)`. The includeSelection state pair stays `[C,x]`. The main chat view component is `Irt`
- Feature 2: the submit handler still uses its callback argument `H` directly for the command text. isSlashCommand `ne`, effective includeSelection `le=C&&!ne`, attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. Only the scroll function was renamed `FN`→`HN`, so the site is now `await e.send(H,h,le,{kind:"human"}),p([]),HN(r,!0)`
- Feature 4: only the stats helper was renamed `lRe`→`tIe`; function now ends `return tIe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.42] — 2026-08-21

Fixed the auto-update watcher so it builds the `.vsix` again. The v2.1.236 and v2.1.238 runs fixed their patches and committed, but produced no package.

- `@vscode/vsce` is now a devDependency with an `npm run vsix` script. `npx @vscode/vsce package` resolved the unpinned spec against `registry.npmjs.org` on every run, which the Bash sandbox blocks. The sandbox was enabled globally on 2026-08-19, and every watcher run after that failed at the packaging step with a 403
- `scripts/on-claude-update.sh` now runs `npm run vsix` itself after the headless Claude run commits, instead of asking Claude to package. The script runs outside the sandbox, and a packaging failure is now reported in the notification instead of passing silently

## [0.6.41] — 2026-08-20

Updated the Feature 4 patch string for Claude Code v2.1.238. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `$Oe`→`lRe`; function now ends `return lRe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.40] — 2026-08-19

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.236. Features 3 and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `ge`→`_e` (the `useState` alias stays `ie`), so the site is now `_=_e(!0),[C,x]=ie(!0),[y,w]=ie(!1)`. The includeSelection state pair stays `[C,x]`. The main chat view component is `Crt`
- Feature 2: the submit handler is `_r` (via `Ht`/useCallback) and uses its callback argument `H` directly for the command text (was `ve`). isSlashCommand is `ne` (was `ot`), effective includeSelection is `le=C&&!ne` (was `O`), and the scroll function was renamed `TN`→`FN`. Attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The site is now `await e.send(H,h,le,{kind:"human"}),p([]),FN(r,!0)`
- Feature 4: only the stats helper was renamed `zAe`→`$Oe`; function now ends `return $Oe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.39] — 2026-08-18

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.235. Features 3 and 5 were unaffected this time.

- Feature 1: the `useState` alias changed `ne`→`ie` (the `useRef` alias stays `ge`), so the site is now `_=ge(!0),[C,x]=ie(!0),[y,w]=ie(!1)`. The includeSelection state pair stays `[C,x]`. The main chat view component is `$ot`
- Feature 2: the submit handler is `Ki` (via `zt`/useCallback) and still uses its callback argument `ve` directly for the command text. isSlashCommand is `ot` (was `st`) and effective includeSelection is `O=C&&!ot` (was `Vt`). The scroll function `TN`, attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The site is now `await e.send(ve,h,O,{kind:"human"}),p([]),TN(r,!0)`
- Feature 4: only the stats helper was renamed `IAe`→`zAe`; function now ends `return zAe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.38] — 2026-08-17

Updated the Feature 4 patch string for Claude Code v2.1.234. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `nAe`→`IAe`; function now ends `return IAe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.37] — 2026-08-14

Updated the Feature 4 patch string for Claude Code v2.1.233. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `XTe`→`nAe`; function now ends `return nAe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.36] — 2026-08-14

Updated the Feature 2 and 4 patch strings for Claude Code v2.1.232. Features 1, 3, and 5 were unaffected this time.

- Feature 2: isSlashCommand is `st` (was `rt`) and the scroll function was renamed `EN`→`TN`. The command text is still the submit callback's argument `ve`, effective includeSelection is still `Vt=C&&!st`, and attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The site is now `await e.send(ve,h,Vt,{kind:"human"}),p([]),TN(r,!0)`. The main chat view component is `Uot` and the submit handler is `zo` (via `Ut`/useCallback)
- Feature 4: only the stats helper was renamed `OTe`→`XTe`; function now ends `return XTe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.35] — 2026-08-12

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.229. Features 3 and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `_e`→`ge` and the `useState` alias changed `ie`→`ne`, so the site is now `_=ge(!0),[C,x]=ne(!0),[y,w]=ne(!1)`. The includeSelection state pair stays `[C,x]`. The main chat view component is `Bot`
- Feature 2: the submit handler still uses its callback argument directly for the command text, now `ve` (was `xe`). isSlashCommand is `rt` (was `Lt`), effective includeSelection is `Vt=C&&!rt` (was `jt`), and the scroll function was renamed `kN`→`EN`. Attached files `h`, attached-files setter `p`, includeSelection reset setter `x`, and scroll ref `r` are unchanged. The site is now `await e.send(ve,h,Vt,{kind:"human"}),p([]),EN(r,!0)`
- Feature 4: only the stats helper was renamed `_Ce`→`OTe`; function now ends `return OTe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.34] — 2026-08-11

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.228. Features 3 and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `we`→`_e` and the includeSelection setter changed `y`→`x` (the `useState` alias stays `ie`), so the site is now `_=_e(!0),[C,x]=ie(!0),[y,w]=ie(!1)`. The main chat view component is `not`
- Feature 2: the submit handler is `Dr` (via `zt`/useCallback) and still uses its callback argument directly for the command text, now `xe` (was `ve`). isSlashCommand is `Lt` (was `_t`), effective includeSelection is `jt=C&&!Lt` (was `bt`), the scroll function was renamed `HD`→`kN`, and the includeSelection reset setter is `x` (was `y`). Attached files `h`, attached-files setter `p`, and scroll ref `r` are unchanged. The site is now `await e.send(xe,h,jt,{kind:"human"}),p([]),kN(r,!0)`
- Feature 4: only the stats helper was renamed `Sme`→`_Ce`; function now ends `return _Ce(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.33] — 2026-08-08

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.226. Features 3 and 5 were unaffected this time.

- Feature 1: the `useRef` alias changed `Se`→`we` (the `useState` alias stays `ie`), so the site is now `_=we(!0),[C,y]=ie(!0),[x,w]=ie(!1)`. The main chat view component is `tJe`
- Feature 2: the submit handler dropped its separate command-text local and now uses the callback argument `ve` directly (was `_e`); isSlashCommand is `_t` (was `ot`), effective includeSelection is `bt=C&&!_t` (was `Wt`), and the scroll function was renamed `BD`→`HD`. Attached files `h`, attached-files setter `p`, includeSelection reset setter `y`, and scroll ref `r` are unchanged. The site is now `await e.send(ve,h,bt,{kind:"human"}),p([]),HD(r,!0)`
- Feature 4: only the stats helper was renamed `Yfe`→`Sme`; function now ends `return Sme(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.32] — 2026-08-07

Updated the Feature 4 patch string for Claude Code v2.1.224. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `Ave`→`Yfe`; function now ends `return Yfe(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.31] — 2026-08-06

Updated the Feature 4 patch string for Claude Code v2.1.223. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `fve`→`Ave`; function now ends `return Ave(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.30] — 2026-08-04

Updated the Feature 4 patch string for Claude Code v2.1.222. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `Q_e`→`fve`; function now ends `return fve(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.29] — 2026-08-03

Updated the Feature 1, Feature 2, and Feature 4 patch strings for Claude Code v2.1.221. Features 3 and 5 were unaffected this time.

- Feature 1: the `useState` alias in the main chat view was renamed `ne`→`ie`; the site is now `_=Se(!0),[C,y]=ie(!0),[x,w]=ie(!1)`. The `useRef` alias `Se` and the destructured state names are unchanged. The main chat view component is now `NQe`
- Feature 2: the submit handler renamed nearly every local. Command text is `_e` (was `K`), isSlashCommand is `ot` (was `Re`), effective includeSelection is `Wt` (was `ct`), and the scroll function is `BD` (was `OD`). Attached files `h`, the attached-files setter `p`, the includeSelection reset setter `y`, and the scroll ref `r` are unchanged; the site is now `await e.send(_e,h,Wt,{kind:"human"}),p([]),BD(r,!0)`
- Feature 4: only the stats helper was renamed `J_e`→`Q_e`; function now ends `return Q_e(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.28] — 2026-07-21

Updated the Feature 4 patch string for Claude Code v2.1.217. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `V_e`→`J_e`; function now ends `return J_e(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.27] — 2026-07-20

Updated the Feature 2 and Feature 4 patch strings for Claude Code v2.1.216. Features 1, 3, and 5 were unaffected this time.

- Feature 2: the submit handler's scroll function was renamed `PD`→`OD` and the isSlashCommand local is now `Re` (was `De`); the site is now `await e.send(K,h,ct,{kind:"human"}),p([]),OD(r,!0)`. Command text `K`, attached files `h`, effective includeSelection `ct`, and the includeSelection reset setter `y` are unchanged
- Feature 4: only the stats helper was renamed `W_e`→`V_e`; function now ends `return V_e(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.26] — 2026-07-17

Updated the Feature 4 patch string for Claude Code v2.1.214. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `M_e`→`W_e`; function now ends `return W_e(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.25] — 2026-07-16

Updated the Feature 4 patch string for Claude Code v2.1.212. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: only the stats helper was renamed `Rue`→`M_e`; function now ends `return M_e(t,s),s.result}`. The Chrome-MCP early-return guard, the `sendRequest` argument order (`suggestions:n},i`, so suggestions is `n` and abortSignal is `i`), and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.24] — 2026-07-15

Updated the Feature 4 patch string for Claude Code v2.1.211. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: the `sendRequest` call's `suggestions`/`abortSignal` argument names reverted again (`suggestions:i},n` → `suggestions:n},i`, so suggestions is `n` and abortSignal is `i`, matching v2.1.208) and the stats helper was renamed `Sue`→`Rue`; function now ends `return Rue(t,s),s.result}`. The Chrome-MCP early-return guard and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.23] — 2026-07-15

Updated the Feature 2 and Feature 4 patch strings for Claude Code v2.1.210. Features 1, 3, and 5 were unaffected this time.

- Feature 2: the `e.send` call gained a fourth argument `{kind:"human"}`; all other vars unchanged (command text arg `K`, isSlashCommand `De`, effective includeSelection `ct`, attached-files setter `p`, includeSelection reset setter `y`, scroll fn `PD`). New site: `await e.send(K,h,ct,{kind:"human"}),p([]),PD(r,!0)`
- Feature 4: the `sendRequest` call's `suggestions`/`abortSignal` argument names reverted (`suggestions:n},i` → `suggestions:i},n`, so suggestions is `i` and abortSignal is `n` again) and the stats helper was renamed `xue`→`Sue`; function now ends `return Sue(t,s),s.result}`. The Chrome-MCP early-return guard and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.22] — 2026-07-13

Updated the Feature 2 and Feature 4 patch strings for Claude Code v2.1.208. Features 1, 3, and 5 were unaffected this time.

- Feature 2: the submit handler's scroll fn was renamed `OD`→`PD`; all other vars unchanged (command text arg `K`, isSlashCommand `De`, effective includeSelection `ct`, attached-files setter `p`, includeSelection reset setter `y`). New site: `await e.send(K,h,ct),p([]),PD(r,!0)`
- Feature 4: the `sendRequest` call swapped the `suggestions`/`abortSignal` argument names (`suggestions:i},n` → `suggestions:n},i`, so suggestions is now `n` and abortSignal is `i`) and the stats helper was renamed `uue`→`xue`; function now ends `return xue(t,s),s.result}`. The Chrome-MCP early-return guard and the remaining vars (`e`=channelId, `t`=toolName, `r`=inputs, `s`=result) are unchanged

## [0.6.21] — 2026-07-11

Updated the Feature 4 patch string for Claude Code v2.1.207. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `Kle`→`uue`; function now ends `return uue(t,s),s.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result) and the Chrome-MCP early-return guard unchanged

## [0.6.20] — 2026-07-10

Updated the Feature 4 patch string for Claude Code v2.1.206. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `Wce`→`Kle`; function now ends `return Kle(t,s),s.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result) and the Chrome-MCP early-return guard unchanged

## [0.6.19] — 2026-07-08

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.205. The webview minifier reassigned the `useState` alias again and the submit handler's variable names shifted; the plan-mode permission function only had its stats helper renamed. Features 3 and 5 were unaffected.

- Feature 1: `useState` alias changed `ie`→`ne`. The `useState` triple is now `_=Se(!0),[C,y]=ne(!0),[x,w]=ne(!1)`
- Feature 2: submit handler vars changed — command text arg `ne`→`K`, isSlashCommand `Je`→`De`, effective includeSelection `Dt`→`ct`, scroll fn stays `OD`. The includeSelection reset setter stays `y`
- Feature 4: stats helper `Bce`→`Wce`; function now ends `return Wce(t,s),s.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result) unchanged

This release was applied manually: the launchd watcher detected v2.1.205 and ran the health check correctly, but the headless `claude -p` auto-fix failed with a `401 Invalid authentication credentials` error after Anthropic forced a re-login.

## [0.6.18] — 2026-07-07

Updated the Feature 1, 2, and 4 patch strings for Claude Code v2.1.204. The webview minifier reassigned the React hook aliases and renamed the main chat view, and the plan-mode permission function gained a new early-return guard. Features 3 and 5 were unaffected.

- Feature 1: main chat view renamed `De1`→`_Qe`; hook aliases changed (`ne`→`ie` for `useState`, `ke`→`Se` for `useRef`). The `useState` triple is now `_=Se(!0),[C,y]=ie(!0),[x,w]=ie(!1)`
- Feature 2: submit handler vars changed — command text arg `K`→`ne`, isSlashCommand `Ee`→`Je`, effective includeSelection `_t`→`Dt`, scroll fn `PD`→`OD`. The includeSelection reset setter stays `y`
- Feature 4: the early-return guard changed to a Chrome-MCP check and the result var was renamed `o`→`s`; stats helper stays `Bce`; function now ends `return Bce(t,s),s.result}`. Vars `e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `s`=result

## [0.6.17] — 2026-07-07

Updated the Feature 4 patch string for Claude Code v2.1.202. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `fae`→`Bce`; function now ends `return Bce(t,o),o.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `o`=result) unchanged

## [0.6.16] — 2026-07-03

Updated the Feature 4 patch string for Claude Code v2.1.200. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `lae`→`fae`; function now ends `return fae(t,o),o.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `o`=result) unchanged

## [0.6.15] — 2026-07-01

Updated the Feature 4 patch string for Claude Code v2.1.198. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `Loe`→`lae`; function now ends `return lae(t,o),o.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `o`=result) unchanged

## [0.6.14] — 2026-06-29

Updated the Feature 4 patch string for Claude Code v2.1.196. Only the stats helper was renamed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `Noe`→`Loe`; function now ends `return Loe(t,o),o.result}`. All surrounding variable names (`e`=channelId, `t`=toolName, `r`=inputs, `i`=suggestions, `n`=abortSignal, `o`=result) unchanged

## [0.6.13] — 2026-06-26

Updated the Feature 2 patch string for Claude Code v2.1.195. Only the scroll function was renamed; no behavior change. Features 1, 3, 4, and 5 were unaffected this time.

- Feature 2: submit-handler scroll fn `MD`→`PD`; command arg `K`, attachedFiles setter `p`, isSlashCommand flag `Ee` (local `let Ee=K.trim().startsWith("/")`), effective includeSelection `_t`, and includeSelection setter `y` all unchanged

## [0.6.12] — 2026-06-25

Updated the Feature 1, Feature 2, and Feature 4 patch strings for Claude Code v2.1.193. Internal variable names changed; no behavior change. Features 3 and 5 were unaffected this time.

- Feature 1: `useState` helper renamed `oe`→`ne` (still bare, no React namespace); includeSelection state is `[C,y]=ne(!0)` → `ne(!1)` (useRef helper `ke` and next state `[x,w]` unchanged)
- Feature 2: submit-handler `useState` namespace `oe`→`ne` propagated through; scroll fn `ND`→`MD`, isSlashCommand flag `Me`→`Ee` (local `let Ee=K.trim().startsWith("/")`), effective includeSelection `bt`→`_t`; command arg `K` and includeSelection setter `y` unchanged
- Feature 4: stats helper `Poe`→`Noe`; function now ends `return Noe(t,o),o.result}`

## [0.6.11] — 2026-06-25

Updated the Feature 1, Feature 2, and Feature 4 patch strings for Claude Code v2.1.191. Internal variable names changed; no behavior change. Features 3 and 5 were unaffected this time.

- Feature 1: includeSelection state setter renamed `[C,x]`→`[C,y]` and next state `[y,w]`→`[x,w]`; still `oe(!0)` → `oe(!1)`
- Feature 2: submit-handler scroll fn `DM`→`ND`, isSlashCommand flag `Ne`→`Me` (local `let Me=K.trim().startsWith("/")`), includeSelection setter `x`→`y`; command arg `K` and effective includeSelection `bt` unchanged
- Feature 4: stats helper `Eoe`→`Poe`; function now ends `return Poe(t,o),o.result}`

## [0.6.10] — 2026-06-24

Updated the Feature 1 patch string for Claude Code v2.1.190. Internal variable name changed; no behavior change. Features 2, 3, 4, and 5 were unaffected this time.

- Feature 1: `useRef` helper renamed `Ie`→`ke`; includeSelection state is still `[C,x]=oe(!0)` → `oe(!1)`

## [0.6.9] — 2026-06-24

Updated the Feature 2 and Feature 4 patch strings for Claude Code v2.1.187. Internal variable names changed; no behavior change. Features 1, 3, and 5 were unaffected this time.

- Feature 2: submit-handler scroll fn `TM`→`DM` (command arg `K`, isSlashCommand `Ne`, effective includeSelection `bt`, includeSelection setter `x` all unchanged)
- Feature 4: stats helper `boe`→`Eoe`; function now ends `return Eoe(t,o),o.result}`

## [0.6.8] — 2026-06-22

Updated the Feature 1, Feature 2, and Feature 4 patch strings for Claude Code v2.1.186. Internal variable names changed; no behavior change. Features 3 and 5 were unaffected this time.

- Feature 1: `useRef`/`useState` helpers are now bare `Ie`/`oe` (no React namespace); includeSelection state is `[C,x]=oe(!0)` → `oe(!1)`
- Feature 2: submit handler vars changed — command arg `$`→`K`, isSlashCommand `De`→`Ne`, effective includeSelection `gt`→`bt`, scroll fn `zN`→`TM`; includeSelection setter is now `x` (toggle-reset and slash-command skip logic unchanged)
- Feature 4: stats helper `moe`→`boe`; function now ends `return boe(t,o),o.result}`

## [0.6.7] — 2026-06-18

Updated the Feature 4 patch string for Claude Code v2.1.183. Internal variable name changed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `coe`→`moe`; function now ends `return moe(t,o),o.result}`

## [0.6.6] — 2026-06-16

Updated the Feature 4 patch string for Claude Code v2.1.179. Internal variable name changed; no behavior change. Features 1, 2, 3, and 5 were unaffected this time.

- Feature 4: stats helper `aoe`→`coe`; function now ends `return coe(t,o),o.result}`

## [0.6.5] — 2026-06-15

Updated the Feature 1, Feature 2, and Feature 4 patch strings for Claude Code v2.1.178. Internal variable names changed; no behavior change.

- Feature 1: React namespace `Ke`→`je` in the `useRef`/`useState` destructuring
- Feature 2: React namespace `Ke`→`je` and scroll function `VN`→`zN` (slash-command skip and toggle reset logic unchanged)
- Feature 4: stats helper `noe`→`aoe`; function now ends `return aoe(t,o),o.result}`

## [0.6.4] — 2026-06-12

Updated the Feature 4 patch string for Claude Code v2.1.177. Internal variable name changed; no behavior change. Feature 2 was unaffected this time.

- Feature 4: stats helper `Lse`→`noe`; function now ends `return noe(t,o),o.result}`

## [0.6.3] — 2026-06-11

Updated Feature 2 and Feature 4 patch strings for Claude Code v2.1.174. Internal variable names changed; no behavior change.

- Feature 2: scroll function `BN`→`VN` (slash-command skip and toggle reset logic unchanged)
- Feature 4: stats helper `Mse`→`Lse`; function now ends `return Lse(t,o),o.result}`

## [0.6.2] — 2026-06-10

Prepared the project for public sharing.

- Added an MIT `LICENSE` (with an AS-IS / no-liability disclaimer and a note that it grants no rights in Anthropic's proprietary Claude Code code); set `"license": "MIT"` in `package.json`.
- Expanded the README disclaimer with a "Legal and terms" section: unofficial/unaffiliated notice, links to Anthropic's terms, and the note that the optional watcher's automated `claude -p` use should authenticate with an Anthropic API key (not subscription login) per Anthropic's Consumer Terms.
- Renamed the publisher and launchd label from `bcerecero` to `Blake-C` (plist file is now `launchd/com.Blake-C.claude-overwrite-watcher.plist`).

## [0.6.1] — 2026-06-10

Made the watcher launchd agent invoke its script directly (it has a `#!/bin/bash` shebang + executable bit) instead of via `/bin/bash`, so the macOS "Allow in the Background" entry displays as the script name rather than a generic "bash". `install-watcher.sh` now ensures the script is executable before loading.

## [0.6.0] — 2026-06-10

Added an optional macOS launchd watcher that auto-detects Claude Code updates and self-heals broken patches.

- Split the vscode-free patch data and pure helpers (`PATCHES`, `applyPatch`, `revertPatch`, `getPatchesByTarget`) into `src/patch-defs.ts` so Node tooling can reuse them; `src/patches.ts` now keeps only the vscode-dependent IO. No behavior change to the extension.
- Added `scripts/check-patches.ts` — a deterministic health check (Node 24+ native TS) that reports whether every patch still matches the installed files (exit 0 healthy / 2 broken), reusing the extension's own `applyPatch`.
- Added `scripts/on-claude-update.sh` + `launchd/com.Blake-C.claude-overwrite-watcher.plist` — a `WatchPaths` agent on `~/.vscode/extensions` that runs the health check on each Claude Code update and, **only when a patch has actually broken**, launches headless `claude -p` (scoped `--allowedTools`, confined to the repo) to rewrite the strings on a new `auto/patch-update-<version>` branch. Never touches `main`, never installs.
- Added npm scripts: `check-patches`, `watcher:install`, `watcher:uninstall`, `watcher:run`, plus `scripts/install-watcher.sh` / `uninstall-watcher.sh`.

## [0.5.1] — 2026-06-10

Updated Feature 2 and Feature 4 patch strings for Claude Code v2.1.172. Internal variable names changed; no behavior change.

- Feature 2: command arg `q`→`$`, effective include-selection `_t`→`gt` (slash-command skip and toggle reset logic unchanged)
- Feature 4: stats helper `Ase`→`Mse`; function now ends `return Mse(t,o),o.result}`

## [0.4.8] — 2026-06-05

Updated patch strings for Claude Code v2.1.165. Internal variable names in `webview/index.js` and `extension.js` changed; all four webview/extension patches updated accordingly. No behavior change.

- Patch 1: `[P,_]=n1.useState` → `[v,x]=Ye.useState`
- Patch 2: `$.send(v1,B,l1)` → `e.send(Oe,h,je)`; slash flag `q1`→`ae`, setter `_`→`x`, scroll `Nk`→`IN`
- Patch 3: compact button handler renamed `J`→`i`
- Patch 4: variable renames `z/V/B/N/K/Z/E80` → `e/t/r/i/n/o/Tse`; also fixed latent variable-shadowing bug in `_mn` (inner regex match renamed `r`→`_m` to avoid shadowing outer `r`=inputs)

## [0.4.7] — 2026-05-22

Updated Feature 2 and Feature 4 patch strings for Claude Code v2.1.162.

## [0.4.6] — 2026-05-12

Fixed Feature 2 include-selection toggle reset.

## [0.4.5] — 2026-05-08

Updated Feature 2 patch strings for Claude Code v2.1.158.

## [0.4.4] — 2026-05-07

Updated Feature 4 patch strings for Claude Code v2.1.158.
