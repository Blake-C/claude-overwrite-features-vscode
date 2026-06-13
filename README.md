# Claude Code — Overwrite Features

> **Use at your own risk.** This extension works by directly modifying the installed Claude Code extension's minified files. It is inherently fragile — any Claude Code update can rename internal variables, restructure the bundle, or move patch sites, silently breaking one or more features. Rapid or back-to-back Claude Code updates are especially likely to leave patches in a partial or failed state. Always check the Claude Code Patches output channel after VS Code restarts and be prepared to revert if something looks wrong.
>
> **Legal and terms.** This is an unofficial, independent project. It is not affiliated with, endorsed by, or supported by Anthropic. Claude Code is proprietary software (© Anthropic PBC, all rights reserved); your use of it is governed by Anthropic's [Consumer Terms](https://www.anthropic.com/legal/consumer-terms), [Commercial Terms](https://www.anthropic.com/legal/commercial-terms), [Usage Policy](https://www.anthropic.com/legal/aup), and the [Claude Code legal terms](https://code.claude.com/docs/en/legal-and-compliance). Modifying Claude Code's files may conflict with those terms (which restrict, among other things, reverse engineering) — review them and decide for yourself before using this. Two specific points:
> - **The optional auto-update watcher runs `claude -p` (the Agent SDK) from a script.** Anthropic's Consumer Terms permit automated/programmatic access **only via an Anthropic API key**, not subscription (Pro/Max) login. If you enable the watcher, authenticate it with `ANTHROPIC_API_KEY`. Note that Agent SDK / `claude -p` usage also draws on usage limits (and, from June 15 2026, a separate Agent SDK credit on subscription plans).
> - This project distributes only your own wrapper code. The short minified fragments used as patch anchors remain Anthropic's; the MIT license here does not grant any rights to Anthropic's code.

A companion VS Code extension that patches six UX behaviors in the [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) extension and adds commands for running Claude Code against a local [Ollama](https://ollama.com) model.

## What it changes

1. **Include-file toggle defaults to OFF** — The "include current file/selection" button in the chat footer starts disabled. You can still toggle it on manually per message.

2. **Attachments are not sent with slash commands** — When you have files attached and trigger `/compact` (or any slash command), those attachments are withheld from the command. Files remain attached and are sent with your next regular message.

   The include-file toggle also resets to OFF automatically after every sent message, so it never carries over to the next one.

3. **Compact button requires confirmation** — Clicking the context-usage button now shows a styled VS Code dialog before compacting, preventing accidental context loss.

4. **Plan-mode permissions respect `~/.claude/settings.json`** — When Claude Code prompts for tool permission during plan mode, the extension checks your `~/.claude/settings.json` allow/deny lists and auto-approves matching tools without showing a dialog.

5. **Panel title shows "Claude Code - Patched"** — The activity bar and sidebar containers are renamed so you can tell at a glance that patches are active.

## Ollama local model integration

In addition to the five patches above, the extension provides commands to route Claude Code to a local [Ollama](https://ollama.com) model instead of the Anthropic API.

Ollama v0.14.0+ exposes a native Anthropic Messages API, so Claude Code connects directly — no proxy needed. To use it:

1. Install and start Ollama, then pull at least one chat model:
   ```bash
   ollama pull qwen2.5-coder
   ollama serve
   ```
2. Run **Claude Code Patch: Use Local Ollama Model** from the Command Palette.
3. Select a model from the list — each entry shows Speed / Coding / Planning scores.
4. Restart Claude Code (the command prompts you).

To go back, run **Claude Code Patch: Revert to Anthropic API (Ollama)** and reload VS Code.

### Model scoring

The picker and recommendation command score each installed model across three categories (0–10) using a static lookup table and size-based heuristics:

| Category | Best for |
|---|---|
| Speed | Fast responses, quick iterations |
| Coding | Code generation, completion, refactoring |
| Planning | Architectural reasoning, multi-step plans |

Models structurally incompatible with Claude Code (embedding models, audio/image models, rerankers) are flagged with a `⚠` prefix in the picker.

### Caveats

- Ollama models are generally slower than Anthropic-hosted Claude models for equivalent tasks. This is expected — local inference runs on your hardware.
- The token-counting endpoint (`/v1/messages/count_tokens`) may return errors with some Ollama versions. Claude Code handles this gracefully.
- Only chat/instruction-tuned models work. Embedding and specialty models are marked incompatible but remain selectable.

## Requirements

- [Claude Code VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) must be installed
- Node.js (via [NVM](https://github.com/nvm-sh/nvm) or global install)
- [`@vscode/vsce`](https://github.com/microsoft/vscode-vsce) for packaging

## Build

```bash
# Source NVM if you use it
source ~/.nvm/nvm.sh && nvm use --lts

# Install dependencies
npm install

# Compile TypeScript and bundle with webpack
npm run package
```

## Package and install

```bash
# Generate the .vsix file
npx @vscode/vsce package

# Install into VS Code
code --install-extension claude-overwrite-features-0.6.4.vsix
```

Then **reload VS Code** — the extension activates on startup and applies patches automatically.

## Output

Patch results are written to the **Claude Code Patches** output channel (View → Output → Claude Code Patches). Each patch reports one of three statuses:

- `✓` — applied this run
- `—` — already applied (no change needed)
- `✗` — pattern not found (Claude Code may have updated)

## Auto-update watcher (optional)

Claude Code updates often, and an update can rename the minified identifiers these patches target, breaking a feature until the patch strings are rewritten. The repo ships an optional macOS [launchd](https://www.launchd.info/) watcher that detects this and self-heals.

How it works:

1. A launchd agent watches `~/.vscode/extensions` and fires when VS Code installs a new `anthropic.claude-code-*` version.
2. `scripts/on-claude-update.sh` runs a **deterministic** health check (`scripts/check-patches.ts`) that tests whether every patch's `from`/`to` literal still appears in the new files. No AI is involved here — it's a string match reusing the same `PATCHES`/`applyPatch` the extension uses.
3. If all patches still match, it does nothing (the extension re-applies them on activation).
4. **Only if a patch has actually broken**, it launches headless Claude Code (`claude -p`) with a scoped permission allowlist to rewrite the broken strings on a new branch `auto/patch-update-<version>`, bump the version, update docs, compile, and package. It commits to the branch and notifies you. It never touches `main` and never installs the `.vsix` — you review and merge.

Install / manage:

```bash
npm run watcher:install     # render the plist with absolute paths and load it
npm run watcher:uninstall   # unload and remove it
npm run check-patches       # run the health check by hand (exit 0 = healthy, 2 = broken)
npm run watcher:run         # run the watcher logic once by hand
```

Notes:

- **Security** — the headless run uses a scoped `--allowedTools` allowlist (Read/Edit/Write plus Bash limited to git/npm/npx/node/python3/code) confined to this repo via `--add-dir`, not `--dangerously-skip-permissions`. Automated commits land on a throwaway branch, so a wrong patch is caught at review.
- **Prerequisites** — `node` must be resolvable for a bare-PATH launchd job (the script initializes fnm); the Claude CLI is expected at `~/.local/bin/claude`. The headless run must be authenticated, and because it is automated/programmatic access it should use an **Anthropic API key** (`ANTHROPIC_API_KEY`) rather than subscription login — see the Legal note above.
- **Logs** — `~/Library/Logs/claude-overwrite-watcher.log`. The last-handled version is tracked in `~/.claude/claude-overwrite-watcher.state`.
- **macOS only** (launchd). On other platforms, run `npm run check-patches` manually or wire the same script into cron/systemd.

## Troubleshooting

### If a feature isn't working

Run **Claude Code Patch: Revert Feature Patches** from the Command Palette, then run **Claude Code Patch: Re-apply Feature Patches**, then reload VS Code. This restores the original files and re-patches from scratch, clearing any partial or stale patch state.

### Uninstalling

The extension patches files on disk inside the Claude Code install. If you disable or uninstall this extension without reverting first, those changes remain permanently and cannot be undone (the revert command requires this extension to be active).

Correct uninstall order:

1. Run **Claude Code Patch: Revert Feature Patches**
2. Disable or uninstall this extension
3. Reload VS Code

Do not reload between steps 1 and 2 — the extension re-activates on startup and will immediately re-apply all patches.

## Caveats

- **Missing repository warning** — `vsce` will warn that no `repository` field is set in `package.json`. This is safe to ignore for local installs. It only matters when publishing to the VS Code Marketplace.
- **Patches break on Claude Code updates** — Because patches are applied directly to the installed extension files, a Claude Code version update will overwrite them. The extension detects this on next startup and re-applies automatically, prompting you to reload.
- **Reload required** — VS Code must be reloaded after patches are applied for changes to take effect (the extension will prompt you).
- **Revert at any time** — Run the command `Claude Code: Revert Feature Patches` from the Command Palette to restore the original files from the backup created on first patch.

## Commands

| Command | Description |
|---|---|
| `Claude Code Patch: Re-apply Feature Patches` | Manually re-apply patches after a Claude Code update |
| `Claude Code Patch: Revert Feature Patches` | Restore original Claude Code files from backup |
| `Claude Code Patch: Preview Compact Confirm Dialog` | Open a webview preview of the compact confirmation dialog |
| `Claude Code Patch: Use Local Ollama Model` | Pick an installed Ollama model and configure Claude Code to use it |
| `Claude Code Patch: Revert to Anthropic API (Ollama)` | Remove Ollama config and restore the default Anthropic API |
| `Claude Code Patch: Check Ollama Status` | Show whether Ollama is reachable, which models are installed, and whether Claude Code is configured to use it |
| `Claude Code Patch: Recommend Ollama Model` | Score all installed Ollama models and recommend the best for speed, coding, and planning |
