import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code'
const STATE_KEY_PATCHED_VERSION = 'patchedClaudeCodeVersion'
const WEBVIEW_FILE = path.join('webview', 'index.js')
const BACKUP_SUFFIX = '.backup'

interface Patch {
	name: string
	from: string
	to: string
}

const PATCHES: Patch[] = [
	{
		name: 'Feature 1: Default include-file toggle to OFF',
		from: 'n1.useRef(!0),[P,_]=n1.useState(!0),[M,w]=n1.useState(!1)',
		to: 'n1.useRef(!0),[P,_]=n1.useState(!1),[M,w]=n1.useState(!1)',
	},
	{
		name: 'Feature 2: Skip attachments on slash commands (compact)',
		from: 'await $.send(x1,B,k5),W([])',
		to: 'await $.send(x1,e1?[]:B,k5),W([])',
	},
	{
		name: 'Feature 3: Confirm before compacting',
		from: 'click to compact`,onClick:J,',
		to: 'click to compact`,onClick:()=>{window.confirm("Compact conversation now?\\n\\nThis will summarize your context window. This cannot be undone.")&&J()},',
	},
]

function findClaudeCodeExtension(): vscode.Extension<unknown> | undefined {
	return vscode.extensions.getExtension(CLAUDE_CODE_EXTENSION_ID)
}

function applyPatch(content: string, patch: Patch): { content: string; applied: boolean; alreadyPatched: boolean } {
	if (content.includes(patch.to)) {
		return { content, applied: false, alreadyPatched: true }
	}
	if (!content.includes(patch.from)) {
		return { content, applied: false, alreadyPatched: false }
	}
	return { content: content.replace(patch.from, patch.to), applied: true, alreadyPatched: false }
}

function revertPatch(content: string, patch: Patch): { content: string; reverted: boolean } {
	if (!content.includes(patch.to)) {
		return { content, reverted: false }
	}
	return { content: content.replace(patch.to, patch.from), reverted: true }
}

async function patchWebview(
	context: vscode.ExtensionContext,
	extensionPath: string,
	silent = false
): Promise<void> {
	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const backupPath = webviewPath + BACKUP_SUFFIX

	if (!fs.existsSync(webviewPath)) {
		vscode.window.showErrorMessage(`Claude Code Patches: webview file not found at ${webviewPath}`)
		return
	}

	let content = fs.readFileSync(webviewPath, 'utf8')

	// Create backup only if one doesn't already exist for this file
	if (!fs.existsSync(backupPath)) {
		fs.writeFileSync(backupPath, content, 'utf8')
	}

	const results: string[] = []
	let anyApplied = false

	for (const patch of PATCHES) {
		const result = applyPatch(content, patch)
		if (result.applied) {
			content = result.content
			anyApplied = true
			results.push(`✓ ${patch.name}`)
		} else if (result.alreadyPatched) {
			results.push(`— ${patch.name} (already applied)`)
		} else {
			results.push(`✗ ${patch.name} (pattern not found — extension may have updated)`)
		}
	}

	if (anyApplied) {
		fs.writeFileSync(webviewPath, content, 'utf8')
	}

	const claudeExt = findClaudeCodeExtension()
	const version = claudeExt?.packageJSON?.version ?? 'unknown'
	await context.globalState.update(STATE_KEY_PATCHED_VERSION, version)

	if (!silent || anyApplied) {
		const summary = results.join('\n')
		if (anyApplied) {
			vscode.window.showInformationMessage(
				`Claude Code Patches applied. Reload VS Code to take effect.\n\n${summary}`,
				'Reload Window'
			).then(action => {
				if (action === 'Reload Window') {
					vscode.commands.executeCommand('workbench.action.reloadWindow')
				}
			})
		} else if (!silent) {
			vscode.window.showInformationMessage(`Claude Code Patches:\n\n${summary}`)
		}
	}
}

async function revertWebview(extensionPath: string): Promise<void> {
	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const backupPath = webviewPath + BACKUP_SUFFIX

	if (fs.existsSync(backupPath)) {
		const backup = fs.readFileSync(backupPath, 'utf8')
		fs.writeFileSync(webviewPath, backup, 'utf8')
		fs.unlinkSync(backupPath)
		vscode.window.showInformationMessage(
			'Claude Code Patches reverted. Reload VS Code to take effect.',
			'Reload Window'
		).then(action => {
			if (action === 'Reload Window') {
				vscode.commands.executeCommand('workbench.action.reloadWindow')
			}
		})
		return
	}

	// No backup — try reverting in-place using patch definitions
	if (!fs.existsSync(webviewPath)) {
		vscode.window.showErrorMessage(`Claude Code Patches: webview file not found at ${webviewPath}`)
		return
	}

	let content = fs.readFileSync(webviewPath, 'utf8')
	let anyReverted = false

	for (const patch of PATCHES) {
		const result = revertPatch(content, patch)
		if (result.reverted) {
			content = result.content
			anyReverted = true
		}
	}

	if (anyReverted) {
		fs.writeFileSync(webviewPath, content, 'utf8')
		vscode.window.showInformationMessage(
			'Claude Code Patches reverted. Reload VS Code to take effect.',
			'Reload Window'
		).then(action => {
			if (action === 'Reload Window') {
				vscode.commands.executeCommand('workbench.action.reloadWindow')
			}
		})
	} else {
		vscode.window.showInformationMessage('Claude Code Patches: no patches to revert.')
	}
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const claudeExt = findClaudeCodeExtension()

	if (!claudeExt) {
		// Claude Code not installed — register commands anyway and bail
		registerCommands(context, undefined)
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
		await patchWebview(context, claudeExt.extensionPath, false)
	} else {
		// Silently verify patches are still in place
		await patchWebview(context, claudeExt.extensionPath, true)
	}

	registerCommands(context, claudeExt.extensionPath)
}

function registerCommands(context: vscode.ExtensionContext, extensionPath: string | undefined): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('claudeOverwrite.applyPatches', async () => {
			const claudeExt = findClaudeCodeExtension()
			if (!claudeExt) {
				vscode.window.showErrorMessage('Claude Code extension not found.')
				return
			}
			await patchWebview(context, claudeExt.extensionPath, false)
		}),

		vscode.commands.registerCommand('claudeOverwrite.revertPatches', async () => {
			const claudeExt = findClaudeCodeExtension()
			if (!claudeExt) {
				vscode.window.showErrorMessage('Claude Code extension not found.')
				return
			}
			await revertWebview(claudeExt.extensionPath)
		})
	)
}

export function deactivate(): void {}
