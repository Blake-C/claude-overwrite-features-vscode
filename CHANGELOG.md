# Changelog

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
