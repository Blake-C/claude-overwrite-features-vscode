# Changelog

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
