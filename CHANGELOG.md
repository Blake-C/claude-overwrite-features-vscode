# Changelog

## [0.6.0] — 2026-06-10

Added an optional macOS launchd watcher that auto-detects Claude Code updates and self-heals broken patches.

- Split the vscode-free patch data and pure helpers (`PATCHES`, `applyPatch`, `revertPatch`, `getPatchesByTarget`) into `src/patch-defs.ts` so Node tooling can reuse them; `src/patches.ts` now keeps only the vscode-dependent IO. No behavior change to the extension.
- Added `scripts/check-patches.ts` — a deterministic health check (Node 24+ native TS) that reports whether every patch still matches the installed files (exit 0 healthy / 2 broken), reusing the extension's own `applyPatch`.
- Added `scripts/on-claude-update.sh` + `launchd/com.bcerecero.claude-overwrite-watcher.plist` — a `WatchPaths` agent on `~/.vscode/extensions` that runs the health check on each Claude Code update and, **only when a patch has actually broken**, launches headless `claude -p` (scoped `--allowedTools`, confined to the repo) to rewrite the strings on a new `auto/patch-update-<version>` branch. Never touches `main`, never installs.
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
