import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export const STATE_KEY_PATCHED_VERSION = 'patchedClaudeCodeVersion'
const WEBVIEW_FILE = path.join('webview', 'index.js')
const EXTENSION_FILE = 'extension.js'
const PACKAGE_JSON_FILE = 'package.json'
const BACKUP_SUFFIX = '.backup'

export interface Patch {
	name: string
	from: string
	to: string
	targetFile?: 'webview' | 'extension' | 'packageJson'
}

export const PATCHES: Patch[] = [
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
		from: 'click to compact`,onClick:J,onMouseEnter:',
		to: 'click to compact`,onClick:()=>{const d=document.createElement("dialog");d.style.cssText="background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);border:1px solid var(--vscode-widget-border,#454545);border-radius:6px;padding:20px;min-width:260px;box-shadow:0 4px 16px rgba(0,0,0,.4);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size,13px)";d.innerHTML=\'<form method="dialog" style="margin:0"><p style="margin:0 0 16px;line-height:1.5">Compact conversation now?<br>This cannot be undone.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button value="cancel" style="padding:4px 14px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;border-radius:3px;cursor:pointer;font:inherit">Cancel</button><button value="ok" autofocus style="padding:4px 14px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:3px;cursor:pointer;font:inherit">Compact</button></div></form>\';document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>{if(d.returnValue==="ok")J();d.remove()})},onMouseEnter:',
	},
	{
		name: 'Feature 4: Respect ~/.claude/settings.json permissions in plan mode',
		targetFile: 'extension',
		from: 'return{behavior:"allow",updatedInput:V};let O=await this.sendRequest(z,{type:"tool_permission_request",toolName:K,inputs:V,suggestions:N},x);',
		to: 'return{behavior:"allow",updatedInput:V};try{const _fs=require("fs"),_cs=JSON.parse(_fs.readFileSync(require("path").join(require("os").homedir(),".claude","settings.json"),"utf8")),_al=_cs?.permissions?.allow??[],_dl=_cs?.permissions?.deny??[],_mn=(p)=>{const r=p.match(/^(\\w+)\\((.+)\\)$/);if(!r)return p===K;if(r[1]!==K)return!1;const c=typeof V==="object"&&V!==null?V.command??V.cmd??V.input??JSON.stringify(V):"";return new RegExp("^"+r[2].replace(/\\*/g,".*")+"$").test(c)};if(!_dl.some(_mn)&&_al.some(_mn))return{behavior:"allow",updatedInput:V}}catch(_e){}let O=await this.sendRequest(z,{type:"tool_permission_request",toolName:K,inputs:V,suggestions:N},x);',
	},
	{
		name: 'Feature 5: Label panel as patched (activitybar container)',
		targetFile: 'packageJson',
		from: '"id": "claude-sidebar",\n\t\t\t\t\t"title": "Claude Code"',
		to: '"id": "claude-sidebar",\n\t\t\t\t\t"title": "Claude Code - Patched"',
	},
	{
		name: 'Feature 5: Label panel as patched (sessions container)',
		targetFile: 'packageJson',
		from: '"id": "claude-sessions-sidebar",\n\t\t\t\t\t"title": "Claude Code"',
		to: '"id": "claude-sessions-sidebar",\n\t\t\t\t\t"title": "Claude Code - Patched"',
	},
	{
		name: 'Feature 5: Label panel as patched (secondary sidebar container)',
		targetFile: 'packageJson',
		from: '"id": "claude-sidebar-secondary",\n\t\t\t\t\t"title": "Claude Code"',
		to: '"id": "claude-sidebar-secondary",\n\t\t\t\t\t"title": "Claude Code - Patched"',
	},
	{
		name: 'Feature 5: Label panel as patched (view name)',
		targetFile: 'packageJson',
		from: '"id": "claudeVSCodeSidebar",\n\t\t\t\t\t"name": "Claude Code"',
		to: '"id": "claudeVSCodeSidebar",\n\t\t\t\t\t"name": "Claude Code - Patched"',
	},
	{
		name: 'Feature 5: Label panel as patched (secondary view name)',
		targetFile: 'packageJson',
		from: '"id": "claudeVSCodeSidebarSecondary",\n\t\t\t\t\t"name": "Claude Code"',
		to: '"id": "claudeVSCodeSidebarSecondary",\n\t\t\t\t\t"name": "Claude Code - Patched"',
	},
]

export function applyPatch(content: string, patch: Patch): { content: string; applied: boolean; alreadyPatched: boolean } {
	if (content.includes(patch.to)) {
		return { content, applied: false, alreadyPatched: true }
	}
	if (!content.includes(patch.from)) {
		return { content, applied: false, alreadyPatched: false }
	}
	return { content: content.replace(patch.from, patch.to), applied: true, alreadyPatched: false }
}

export function revertPatch(content: string, patch: Patch): { content: string; reverted: boolean } {
	if (!content.includes(patch.to)) {
		return { content, reverted: false }
	}
	return { content: content.replace(patch.to, patch.from), reverted: true }
}

export function applyPatchesToFile(filePath: string, patches: Patch[]): { results: string[]; anyApplied: boolean } {
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

export async function patchWebview(
	context: vscode.ExtensionContext,
	extensionPath: string,
	silent: boolean,
	outputChannel: vscode.OutputChannel,
	version: string
): Promise<void> {
	const webviewPatches = PATCHES.filter(p => !p.targetFile || p.targetFile === 'webview')
	const extensionPatches = PATCHES.filter(p => p.targetFile === 'extension')
	const packageJsonPatches = PATCHES.filter(p => p.targetFile === 'packageJson')

	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const { results: webviewResults, anyApplied: webviewApplied } = applyPatchesToFile(webviewPath, webviewPatches)

	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const { results: extensionResults, anyApplied: extensionApplied } = applyPatchesToFile(extensionJsPath, extensionPatches)

	const packageJsonPath = path.join(extensionPath, PACKAGE_JSON_FILE)
	const { results: pkgResults, anyApplied: pkgApplied } = applyPatchesToFile(packageJsonPath, packageJsonPatches)

	const anyApplied = webviewApplied || extensionApplied || pkgApplied
	const allResults = [...webviewResults, ...extensionResults, ...pkgResults]

	await context.globalState.update(STATE_KEY_PATCHED_VERSION, version)

	if (!silent || anyApplied) {
		outputChannel.clear()
		outputChannel.appendLine(`Claude Code Patches — Claude Code v${version}`)
		outputChannel.appendLine('')
		for (const line of allResults) {
			outputChannel.appendLine(line)
		}

		const applied = allResults.filter(r => r.startsWith('✓')).length
		const total = allResults.length

		if (anyApplied) {
			vscode.window.showInformationMessage(
				`Claude Code Patches: ${applied}/${total} applied. Reload VS Code to take effect.`,
				'Reload Window',
				'Show Log'
			).then(action => {
				if (action === 'Reload Window') {
					vscode.commands.executeCommand('workbench.action.reloadWindow')
				} else if (action === 'Show Log') {
					outputChannel.show()
				}
			})
		} else if (!silent) {
			vscode.window.showInformationMessage(
				`Claude Code Patches: all ${total} already applied.`,
				'Show Log'
			).then(action => {
				if (action === 'Show Log') outputChannel.show()
			})
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

export async function revertWebview(extensionPath: string): Promise<void> {
	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const packageJsonPath = path.join(extensionPath, PACKAGE_JSON_FILE)
	const webviewBackup = webviewPath + BACKUP_SUFFIX
	const extensionBackup = extensionJsPath + BACKUP_SUFFIX
	const packageJsonBackup = packageJsonPath + BACKUP_SUFFIX

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
	if (fs.existsSync(packageJsonBackup)) {
		fs.writeFileSync(packageJsonPath, fs.readFileSync(packageJsonBackup, 'utf8'), 'utf8')
		fs.unlinkSync(packageJsonBackup)
		anyReverted = true
	}

	if (!anyReverted) {
		const webviewPatches = PATCHES.filter(p => !p.targetFile || p.targetFile === 'webview')
		const extensionPatches = PATCHES.filter(p => p.targetFile === 'extension')
		const packageJsonPatches = PATCHES.filter(p => p.targetFile === 'packageJson')
		const wReverted = revertFile(webviewPath, webviewPatches)
		const eReverted = revertFile(extensionJsPath, extensionPatches)
		const pjReverted = revertFile(packageJsonPath, packageJsonPatches)
		anyReverted = wReverted || eReverted || pjReverted
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
