# Changelog

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
