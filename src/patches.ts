import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import {
	PATCHES,
	Patch,
	applyPatch,
	revertPatch,
	getPatchesByTarget,
	WEBVIEW_FILE,
	EXTENSION_FILE,
	PACKAGE_JSON_FILE,
	BACKUP_SUFFIX,
	STATE_KEY_PATCHED_VERSION,
} from './patch-defs'

export { STATE_KEY_PATCHED_VERSION, PATCHES }
export type { Patch }

export function applyPatchesToFile(filePath: string, patches: Patch[]): { resultMap: Map<string, string>; anyApplied: boolean } {
	const resultMap = new Map<string, string>()
	let anyApplied = false

	if (!fs.existsSync(filePath)) {
		for (const patch of patches) {
			resultMap.set(patch.name, `✗ ${patch.name} (file not found)`)
		}
		return { resultMap, anyApplied }
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
			resultMap.set(patch.name, `✓ ${patch.name}`)
		} else if (result.alreadyPatched) {
			resultMap.set(patch.name, `— ${patch.name} (already applied)`)
		} else {
			resultMap.set(patch.name, `✗ ${patch.name} (pattern not found — extension may have updated)`)
		}
	}

	if (anyApplied) {
		fs.writeFileSync(filePath, content, 'utf8')
	}

	return { resultMap, anyApplied }
}

function worstSymbol(lines: string[]): '✓' | '—' | '✗' {
	if (lines.some(l => l.startsWith('✗'))) return '✗'
	if (lines.some(l => l.startsWith('✓'))) return '✓'
	return '—'
}

function symbolSuffix(symbol: '✓' | '—' | '✗'): string {
	if (symbol === '—') return ' (already applied)'
	if (symbol === '✗') return ' (pattern not found — extension may have updated)'
	return ''
}

function buildOrderedResults(resultMap: Map<string, string>): string[] {
	const orderedResults: string[] = []
	let feature5Emitted = false
	for (const patch of PATCHES) {
		// Fragile: 'Feature 5:' prefix is the grouping key — rename any Feature 5 patch and update this check
		if (patch.name.startsWith('Feature 5:')) {
			if (!feature5Emitted) {
				feature5Emitted = true
				const f5Lines = PATCHES.filter(p => p.name.startsWith('Feature 5:')).map(p => resultMap.get(p.name) ?? `✗ ${p.name} (result missing)`)
				const symbol = worstSymbol(f5Lines)
				orderedResults.push(`${symbol} Feature 5: Label panel as patched${symbolSuffix(symbol)}`)
			}
		} else {
			const line = resultMap.get(patch.name)
			if (line) orderedResults.push(line)
		}
	}
	return orderedResults
}

export async function patchWebview(
	context: vscode.ExtensionContext,
	extensionPath: string,
	silent: boolean,
	outputChannel: vscode.OutputChannel,
	version: string
): Promise<void> {
	const webviewPatches = getPatchesByTarget('webview')
	const extensionPatches = getPatchesByTarget('extension')
	const packageJsonPatches = getPatchesByTarget('packageJson')

	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const { resultMap: webviewMap, anyApplied: webviewApplied } = applyPatchesToFile(webviewPath, webviewPatches)

	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const { resultMap: extensionMap, anyApplied: extensionApplied } = applyPatchesToFile(extensionJsPath, extensionPatches)

	const packageJsonPath = path.join(extensionPath, PACKAGE_JSON_FILE)
	const { resultMap: pkgMap, anyApplied: pkgApplied } = applyPatchesToFile(packageJsonPath, packageJsonPatches)

	const anyApplied = webviewApplied || extensionApplied || pkgApplied

	const resultMap = new Map<string, string>([...webviewMap, ...extensionMap, ...pkgMap])

	const orderedResults = buildOrderedResults(resultMap)

	await context.globalState.update(STATE_KEY_PATCHED_VERSION, version)

	if (!silent || anyApplied) {
		outputChannel.clear()
		outputChannel.appendLine(`Claude Code Patches — Claude Code v${version}`)
		outputChannel.appendLine('')
		for (const line of orderedResults) {
			outputChannel.appendLine(line)
		}

		const applied = orderedResults.filter(r => r.startsWith('✓')).length
		const total = orderedResults.length

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

export async function revertWebview(extensionPath: string, outputChannel: vscode.OutputChannel): Promise<void> {
	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const packageJsonPath = path.join(extensionPath, PACKAGE_JSON_FILE)
	const webviewBackup = webviewPath + BACKUP_SUFFIX
	const extensionBackup = extensionJsPath + BACKUP_SUFFIX
	const packageJsonBackup = packageJsonPath + BACKUP_SUFFIX

	const log: string[] = []
	let anyReverted = false

	if (fs.existsSync(webviewBackup)) {
		fs.writeFileSync(webviewPath, fs.readFileSync(webviewBackup, 'utf8'), 'utf8')
		fs.unlinkSync(webviewBackup)
		log.push('✓ webview/index.js — restored from backup')
		anyReverted = true
	} else {
		const reverted = revertFile(webviewPath, getPatchesByTarget('webview'))
		log.push(reverted ? '✓ webview/index.js — reverted in-place' : '— webview/index.js — nothing to revert')
		if (reverted) anyReverted = true
	}

	if (fs.existsSync(extensionBackup)) {
		fs.writeFileSync(extensionJsPath, fs.readFileSync(extensionBackup, 'utf8'), 'utf8')
		fs.unlinkSync(extensionBackup)
		log.push('✓ extension.js — restored from backup')
		anyReverted = true
	} else {
		const reverted = revertFile(extensionJsPath, getPatchesByTarget('extension'))
		log.push(reverted ? '✓ extension.js — reverted in-place' : '— extension.js — nothing to revert')
		if (reverted) anyReverted = true
	}

	if (fs.existsSync(packageJsonBackup)) {
		fs.writeFileSync(packageJsonPath, fs.readFileSync(packageJsonBackup, 'utf8'), 'utf8')
		fs.unlinkSync(packageJsonBackup)
		log.push('✓ package.json — restored from backup')
		anyReverted = true
	} else {
		const reverted = revertFile(packageJsonPath, getPatchesByTarget('packageJson'))
		log.push(reverted ? '✓ package.json — reverted in-place' : '— package.json — nothing to revert')
		if (reverted) anyReverted = true
	}

	outputChannel.clear()
	outputChannel.appendLine('Claude Code Patches — Revert')
	outputChannel.appendLine('')
	for (const line of log) {
		outputChannel.appendLine(line)
	}

	if (anyReverted) {
		vscode.window.showInformationMessage(
			'Claude Code Patches reverted. Reload VS Code to take effect.',
			'Reload Window',
			'Show Log'
		).then(action => {
			if (action === 'Reload Window') {
				vscode.commands.executeCommand('workbench.action.reloadWindow')
			} else if (action === 'Show Log') {
				outputChannel.show()
			}
		})
	} else {
		vscode.window.showInformationMessage('Claude Code Patches: no patches to revert.', 'Show Log').then(action => {
			if (action === 'Show Log') outputChannel.show()
		})
	}
}
