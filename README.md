# Claude Code — Overwrite Features

> **Use at your own risk.** This extension works by directly modifying the installed Claude Code extension's minified files. It is inherently fragile — any Claude Code update can rename internal variables, restructure the bundle, or move patch sites, silently breaking one or more features. Rapid or back-to-back Claude Code updates are especially likely to leave patches in a partial or failed state. Always check the Claude Code Patches output channel after VS Code restarts and be prepared to revert if something looks wrong.

A companion VS Code extension that patches five UX behaviors in the [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) extension.

## What it changes

1. **Include-file toggle defaults to OFF** — The "include current file/selection" button in the chat footer starts disabled. You can still toggle it on manually per message.

2. **Attachments are not sent with slash commands** — When you have files attached and trigger `/compact` (or any slash command), those attachments are withheld from the command. Files remain attached and are sent with your next regular message.

3. **Compact button requires confirmation** — Clicking the context-usage button now shows a styled VS Code dialog before compacting, preventing accidental context loss.

4. **Plan-mode permissions respect `~/.claude/settings.json`** — When Claude Code prompts for tool permission during plan mode, the extension checks your `~/.claude/settings.json` allow/deny lists and auto-approves matching tools without showing a dialog.

5. **Panel title shows "Claude Code - Patched"** — The activity bar and sidebar containers are renamed so you can tell at a glance that patches are active.

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
code --install-extension claude-overwrite-features-0.1.0.vsix
```

Then **reload VS Code** — the extension activates on startup and applies patches automatically.

## Output

Patch results are written to the **Claude Code Patches** output channel (View → Output → Claude Code Patches). Each patch reports one of three statuses:

- `✓` — applied this run
- `—` — already applied (no change needed)
- `✗` — pattern not found (Claude Code may have updated)

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
