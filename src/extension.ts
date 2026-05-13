import * as vscode from 'vscode'
import { patchWebview, revertWebview, STATE_KEY_PATCHED_VERSION } from './patches'
import { configureOllama, ollamaStatus, ollamaRecommend, revertOllama } from './ollama'

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code'

let outputChannel: vscode.OutputChannel | undefined

function findClaudeCodeExtension(): vscode.Extension<unknown> | undefined {
	return vscode.extensions.getExtension(CLAUDE_CODE_EXTENSION_ID)
}

function buildPreviewHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<style>
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--vscode-editor-background); }
  dialog[open] { background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); border: 1px solid var(--vscode-widget-border, #454545); border-radius: 6px; padding: 20px; min-width: 260px; box-shadow: 0 4px 16px rgba(0,0,0,.4); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size, 13px); }
</style>
</head>
<body>
<dialog id="d" open>
  <form method="dialog" style="margin:0">
    <p style="margin:0 0 16px;line-height:1.5">Compact conversation now?<br>This cannot be undone.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button value="cancel" style="padding:4px 14px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;border-radius:3px;cursor:pointer;font:inherit">Cancel</button>
      <button value="ok" style="padding:4px 14px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:3px;cursor:pointer;font:inherit">Compact</button>
    </div>
  </form>
</dialog>
</body></html>`
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	outputChannel = vscode.window.createOutputChannel('Claude Code Patches')
	context.subscriptions.push(outputChannel)

	const claudeExt = findClaudeCodeExtension()

	if (!claudeExt) {
		registerCommands(context)
		return
	}

	const currentVersion: string = claudeExt.packageJSON?.version ?? ''
	const patchedVersion: string = context.globalState.get<string>(STATE_KEY_PATCHED_VERSION, '')

	const versionChanged = currentVersion !== patchedVersion && patchedVersion !== ''
	const neverPatched = patchedVersion === ''

	if (versionChanged) {
		vscode.window.showWarningMessage(
			`Claude Code updated (${patchedVersion} → ${currentVersion}). Re-applying patches...`
		)
	}

	if (neverPatched || versionChanged) {
		await patchWebview(context, claudeExt.extensionPath, false, outputChannel, currentVersion)
	} else {
		await patchWebview(context, claudeExt.extensionPath, true, outputChannel, currentVersion)
	}

	registerCommands(context)
}

function registerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('claudeOverwrite.applyPatches', async () => {
			const claudeExt = findClaudeCodeExtension()
			if (!claudeExt) {
				vscode.window.showErrorMessage('Claude Code extension not found.')
				return
			}
			const version: string = claudeExt.packageJSON?.version ?? 'unknown'
			await patchWebview(context, claudeExt.extensionPath, false, outputChannel!, version)
		}),

		vscode.commands.registerCommand('claudeOverwrite.revertPatches', async () => {
			const claudeExt = findClaudeCodeExtension()
			if (!claudeExt) {
				vscode.window.showErrorMessage('Claude Code extension not found.')
				return
			}
			await revertWebview(claudeExt.extensionPath)
		}),

		vscode.commands.registerCommand('claudeOverwrite.ollamaStatus', () => ollamaStatus(outputChannel!)),

		vscode.commands.registerCommand('claudeOverwrite.ollamaRecommend', () => ollamaRecommend(outputChannel!)),

vscode.commands.registerCommand('claudeOverwrite.configureOllama', () => configureOllama()),

		vscode.commands.registerCommand('claudeOverwrite.revertOllama', () => revertOllama()),

		vscode.commands.registerCommand('claudeOverwrite.previewDialog', () => {
			const panel = vscode.window.createWebviewPanel(
				'claudeOverwritePreview',
				'Compact Dialog Preview',
				vscode.ViewColumn.One,
				{}
			)
			panel.webview.html = buildPreviewHtml()
		})
	)
}

export function deactivate(): void {}
