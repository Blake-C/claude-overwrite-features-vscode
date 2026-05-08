import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code'
const STATE_KEY_PATCHED_VERSION = 'patchedClaudeCodeVersion'
const WEBVIEW_FILE = path.join('webview', 'index.js')
const EXTENSION_FILE = 'extension.js'
const BACKUP_SUFFIX = '.backup'

interface Patch {
	name: string
	from: string
	to: string
	targetFile?: 'webview' | 'extension'
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
		from: 'click to compact`,onClick:()=>{const d=document.createElement("dialog");d.innerHTML=\'<form method="dialog" style="padding:16px;font-family:inherit"><p style="margin:0 0 12px">Compact conversation now?<br>This cannot be undone.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button value="cancel">Cancel</button><button value="ok" autofocus>Compact</button></div></form>\';document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>{if(d.returnValue==="ok")J();d.remove()})},',
		to: 'click to compact`,onClick:()=>{const d=document.createElement("dialog");d.style.cssText="background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);border:1px solid var(--vscode-widget-border,#454545);border-radius:6px;padding:20px;min-width:260px;box-shadow:0 4px 16px rgba(0,0,0,.4);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size,13px)";d.innerHTML=\'<form method="dialog" style="margin:0"><p style="margin:0 0 16px;line-height:1.5">Compact conversation now?<br>This cannot be undone.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button value="cancel" style="padding:4px 14px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;border-radius:3px;cursor:pointer;font:inherit">Cancel</button><button value="ok" autofocus style="padding:4px 14px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:3px;cursor:pointer;font:inherit">Compact</button></div></form>\';document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>{if(d.returnValue==="ok")J();d.remove()})},',
	},
	{
		name: 'Feature 4: Respect ~/.claude/settings.json permissions in plan mode',
		targetFile: 'extension',
		from: 'return{behavior:"allow",updatedInput:B};let q=await this.sendRequest(V,{type:"tool_permission_request",toolName:K,inputs:B,suggestions:x},G);',
		to: 'return{behavior:"allow",updatedInput:B};try{const _fs=require("fs"),_cs=JSON.parse(_fs.readFileSync(require("path").join(require("os").homedir(),".claude","settings.json"),"utf8")),_al=_cs?.permissions?.allow??[],_dl=_cs?.permissions?.deny??[],_mn=(p)=>{const r=p.match(/^(\\w+)\\((.+)\\)$/);if(!r)return p===K;if(r[1]!==K)return!1;const c=typeof B==="object"&&B!==null?B.command??B.cmd??B.input??JSON.stringify(B):"";return new RegExp("^"+r[2].replace(/\\*/g,".*")+"$").test(c)};if(!_dl.some(_mn)&&_al.some(_mn))return{behavior:"allow",updatedInput:B}}catch(_e){}let q=await this.sendRequest(V,{type:"tool_permission_request",toolName:K,inputs:B,suggestions:x},G);',
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

function applyPatchesToFile(
	filePath: string,
	patches: Patch[]
): { results: string[]; anyApplied: boolean } {
	const results: string[] = []
	let anyApplied = false

	if (!fs.existsSync(filePath)) {
		for (const patch of patches) {
			results.push(`✗ ${patch.name} (file not found)`)
		}
		return { results, anyApplied }
	}

	let content = fs.readFileSync(filePath, 'utf8')
	const backupPath = filePath + BACKUP_SUFFIX

	if (!fs.existsSync(backupPath)) {
		fs.writeFileSync(backupPath, content, 'utf8')
	}

	for (const patch of patches) {
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
		fs.writeFileSync(filePath, content, 'utf8')
	}

	return { results, anyApplied }
}

async function patchWebview(
	context: vscode.ExtensionContext,
	extensionPath: string,
	silent = false
): Promise<void> {
	const webviewPatches = PATCHES.filter(p => !p.targetFile || p.targetFile === 'webview')
	const extensionPatches = PATCHES.filter(p => p.targetFile === 'extension')

	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const { results: webviewResults, anyApplied: webviewApplied } = applyPatchesToFile(webviewPath, webviewPatches)

	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const { results: extensionResults, anyApplied: extensionApplied } = applyPatchesToFile(extensionJsPath, extensionPatches)

	const anyApplied = webviewApplied || extensionApplied
	const allResults = [...webviewResults, ...extensionResults]

	const claudeExt = findClaudeCodeExtension()
	const version = claudeExt?.packageJSON?.version ?? 'unknown'
	await context.globalState.update(STATE_KEY_PATCHED_VERSION, version)

	if (!silent || anyApplied) {
		const summary = allResults.join('\n')
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

function revertFile(filePath: string, patches: Patch[]): boolean {
	if (!fs.existsSync(filePath)) return false
	let content = fs.readFileSync(filePath, 'utf8')
	let reverted = false
	for (const patch of patches) {
		const result = revertPatch(content, patch)
		if (result.reverted) {
			content = result.content
			reverted = true
		}
	}
	if (reverted) {
		fs.writeFileSync(filePath, content, 'utf8')
	}
	return reverted
}

async function revertWebview(extensionPath: string): Promise<void> {
	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const webviewBackup = webviewPath + BACKUP_SUFFIX
	const extensionBackup = extensionJsPath + BACKUP_SUFFIX

	let anyReverted = false

	if (fs.existsSync(webviewBackup)) {
		fs.writeFileSync(webviewPath, fs.readFileSync(webviewBackup, 'utf8'), 'utf8')
		fs.unlinkSync(webviewBackup)
		anyReverted = true
	}
	if (fs.existsSync(extensionBackup)) {
		fs.writeFileSync(extensionJsPath, fs.readFileSync(extensionBackup, 'utf8'), 'utf8')
		fs.unlinkSync(extensionBackup)
		anyReverted = true
	}

	if (!anyReverted) {
		// No backups — try reverting in-place using patch definitions
		const webviewPatches = PATCHES.filter(p => !p.targetFile || p.targetFile === 'webview')
		const extensionPatches = PATCHES.filter(p => p.targetFile === 'extension')
		const wReverted = revertFile(webviewPath, webviewPatches)
		const eReverted = revertFile(extensionJsPath, extensionPatches)
		anyReverted = wReverted || eReverted
	}

	if (anyReverted) {
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
		}),

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
