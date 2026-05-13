import * as vscode from 'vscode'
import * as fs from 'fs'
import * as http from 'http'
import * as os from 'os'
import * as path from 'path'

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code'
const STATE_KEY_PATCHED_VERSION = 'patchedClaudeCodeVersion'
const WEBVIEW_FILE = path.join('webview', 'index.js')
const EXTENSION_FILE = 'extension.js'
const PACKAGE_JSON_FILE = 'package.json'
const BACKUP_SUFFIX = '.backup'

let outputChannel: vscode.OutputChannel | undefined

interface Patch {
	name: string
	from: string
	to: string
	targetFile?: 'webview' | 'extension' | 'packageJson'
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
	const packageJsonPatches = PATCHES.filter(p => p.targetFile === 'packageJson')

	const webviewPath = path.join(extensionPath, WEBVIEW_FILE)
	const { results: webviewResults, anyApplied: webviewApplied } = applyPatchesToFile(webviewPath, webviewPatches)

	const extensionJsPath = path.join(extensionPath, EXTENSION_FILE)
	const { results: extensionResults, anyApplied: extensionApplied } = applyPatchesToFile(extensionJsPath, extensionPatches)

	const packageJsonPath = path.join(extensionPath, PACKAGE_JSON_FILE)
	const { results: pkgResults, anyApplied: pkgApplied } = applyPatchesToFile(packageJsonPath, packageJsonPatches)

	const anyApplied = webviewApplied || extensionApplied || pkgApplied
	const allResults = [...webviewResults, ...extensionResults, ...pkgResults]

	const claudeExt = findClaudeCodeExtension()
	const version = claudeExt?.packageJSON?.version ?? 'unknown'
	await context.globalState.update(STATE_KEY_PATCHED_VERSION, version)

	if (!silent || anyApplied) {
		outputChannel!.clear()
		outputChannel!.appendLine(`Claude Code Patches — Claude Code v${version}`)
		outputChannel!.appendLine('')
		for (const line of allResults) {
			outputChannel!.appendLine(line)
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
					outputChannel!.show()
				}
			})
		} else if (!silent) {
			vscode.window.showInformationMessage(
				`Claude Code Patches: all ${total} already applied.`,
				'Show Log'
			).then(action => {
				if (action === 'Show Log') outputChannel!.show()
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

async function revertWebview(extensionPath: string): Promise<void> {
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
		// No backups — try reverting in-place using patch definitions
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

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	outputChannel = vscode.window.createOutputChannel('Claude Code Patches')
	context.subscriptions.push(outputChannel)

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

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json')

function readClaudeSettings(): Record<string, unknown> {
	if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) return {}
	try {
		return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'))
	} catch {
		return {}
	}
}

function writeClaudeSettings(settings: Record<string, unknown>): void {
	const dir = path.dirname(CLAUDE_SETTINGS_PATH)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
	fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, '\t'), 'utf8')
}

function ollamaGet(endpoint: string): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const req = http.get(`http://localhost:11434${endpoint}`, res => {
			let data = ''
			res.on('data', chunk => { data += chunk })
			res.on('end', () => {
				try { resolve(JSON.parse(data)) } catch { reject(new Error('Failed to parse Ollama response')) }
			})
		})
		req.on('error', reject)
		req.setTimeout(3000, () => { req.destroy(); reject(new Error('Ollama connection timed out')) })
	})
}

function fetchOllamaModels(): Promise<string[]> {
	return ollamaGet('/api/tags').then(parsed => {
		const p = parsed as { models?: { name: string }[] }
		return (p.models ?? []).map(m => m.name)
	})
}

async function configureOllama(): Promise<void> {
	let models: string[]
	let loadedNames: string[] = []
	try {
		models = await fetchOllamaModels()
		const ps = await ollamaGet('/api/ps').catch(() => ({ models: [] })) as { models?: { name: string }[] }
		loadedNames = (ps.models ?? []).map(m => m.name)
	} catch (err) {
		vscode.window.showErrorMessage(
			`Could not connect to Ollama at http://localhost:11434. Make sure Ollama is running. (${err instanceof Error ? err.message : err})`
		)
		return
	}

	if (models.length === 0) {
		vscode.window.showErrorMessage('Ollama is running but has no models installed. Run `ollama pull <model>` first.')
		return
	}

	// Probe already-loaded models (free — already in VRAM)
	const probeResults = new Map<string, 'compatible' | 'incompatible'>()
	await Promise.all(loadedNames.map(async name => {
		probeResults.set(name, await probeLoadedModel(name))
	}))

	const items: vscode.QuickPickItem[] = models.map(name => {
		const staticReason = isStaticallyIncompatible(name)
		const probeResult = probeResults.get(name)
		const scores = scoreModel(name)
		const scoreStr = `Speed:${scores.speed}  Coding:${scores.coding}  Planning:${scores.planning}`

		if (staticReason) {
			return { label: `⚠ ${name}`, description: `incompatible — ${staticReason}`, detail: '(selectable, but likely broken with Claude Code)' }
		}
		if (probeResult === 'incompatible') {
			return { label: `⚠ ${name}`, description: 'tested — tool use not supported', detail: scoreStr }
		}
		if (probeResult === 'compatible') {
			return { label: `✓ ${name} (tested)`, description: scoreStr }
		}
		return { label: name, description: scoreStr }
	})

	const picked = await vscode.window.showQuickPick(items, {
		title: 'Select Ollama Model for Claude Code',
		placeHolder: 'Choose a local model',
	})
	if (!picked) return

	const modelName = picked.label.replace(/^[✓⚠] /, '').replace(/ \(tested\)$/, '')

	const settings = readClaudeSettings()
	const env = ((settings.env ?? {}) as Record<string, string>)
	env['ANTHROPIC_BASE_URL'] = 'http://localhost:11434'
	env['ANTHROPIC_AUTH_TOKEN'] = 'ollama'
	env['ANTHROPIC_MODEL'] = modelName
	settings.env = env
	writeClaudeSettings(settings)

	const action = await vscode.window.showInformationMessage(
		`Claude Code configured to use local Ollama model "${modelName}". Restart Claude Code to apply.`,
		'Revert to Anthropic API'
	)
	if (action === 'Revert to Anthropic API') {
		await revertOllama()
	}
}

async function ollamaStatus(): Promise<void> {
	const settings = readClaudeSettings()
	const env = settings.env as Record<string, string> | undefined
	const configuredUrl: string | undefined = env?.['ANTHROPIC_BASE_URL']
	const configuredModel: string | undefined = env?.['ANTHROPIC_MODEL']
	const isConfigured = configuredUrl?.includes('11434')

	const lines: string[] = ['Ollama Status']
	lines.push(`Claude Code config: ${isConfigured ? `✓ ANTHROPIC_BASE_URL = ${configuredUrl}` : '✗ Not pointing at Ollama'}`)
	if (configuredModel) lines.push(`  ANTHROPIC_MODEL = ${configuredModel}`)

	let installedModels: string[] = []
	let loadedModels: { name: string; size_vram: number }[] = []
	let ollamaReachable = false

	try {
		installedModels = await fetchOllamaModels()
		ollamaReachable = true
		lines.push(`Ollama: ✓ reachable — ${installedModels.length} model(s) installed`)
		for (const m of installedModels) lines.push(`  • ${m}`)
	} catch {
		lines.push('Ollama: ✗ unreachable at http://localhost:11434 — is it running?')
	}

	if (ollamaReachable) {
		try {
			const ps = await ollamaGet('/api/ps') as { models?: { name: string; size_vram: number }[] }
			loadedModels = ps.models ?? []
			if (loadedModels.length > 0) {
				lines.push(`Loaded in VRAM: ${loadedModels.map(m => `${m.name} (${Math.round(m.size_vram / 1024 / 1024)} MB)`).join(', ')}`)
			} else {
				lines.push('Loaded in VRAM: none (model will load on first request)')
			}
		} catch {
			lines.push('Loaded in VRAM: unknown (could not reach /api/ps)')
		}
	}

	outputChannel!.clear()
	outputChannel!.appendLine(lines.join('\n'))
	outputChannel!.show()

	const activeModel = loadedModels[0]?.name ?? configuredModel ?? 'none'
	const summary = ollamaReachable
		? `Ollama ✓ | Model: ${activeModel}${loadedModels.length > 0 ? ' (loaded)' : ' (not yet loaded)'} | Claude Code: ${isConfigured ? 'configured' : 'NOT configured'}`
		: 'Ollama unreachable at http://localhost:11434 — is it running?'

	if (!ollamaReachable) {
		vscode.window.showErrorMessage(summary)
	} else if (!isConfigured) {
		vscode.window.showWarningMessage(summary, 'Configure Now').then(action => {
			if (action === 'Configure Now') vscode.commands.executeCommand('claudeOverwrite.configureOllama')
		})
	} else {
		vscode.window.showInformationMessage(summary)
	}
}

interface ModelScores { speed: number; coding: number; planning: number }

const MODEL_SCORES: Array<{ pattern: RegExp; scores: ModelScores }> = [
	{ pattern: /phi[34][-:]?mini|phi3:mini/i,               scores: { speed: 9, coding: 6, planning: 5 } },
	{ pattern: /phi4/i,                                      scores: { speed: 8, coding: 7, planning: 6 } },
	{ pattern: /gemma[23]?:[12]b|gemma[23]?:4b|gemma2:2b/i, scores: { speed: 9, coding: 6, planning: 5 } },
	{ pattern: /gemma/i,                                     scores: { speed: 7, coding: 7, planning: 6 } },
	{ pattern: /llama3\.[23]:[13]b/i,                        scores: { speed: 9, coding: 6, planning: 5 } },
	{ pattern: /llama[^/]*(70b|72b)/i,                       scores: { speed: 2, coding: 8, planning: 9 } },
	{ pattern: /qwen[23][^/]*coder/i,                        scores: { speed: 6, coding: 10, planning: 6 } },
	{ pattern: /qwen[23]?:[38]b/i,                           scores: { speed: 7, coding: 7, planning: 6 } },
	{ pattern: /qwen/i,                                      scores: { speed: 6, coding: 7, planning: 6 } },
	{ pattern: /codellama|deepseek-coder|starcoder|codegemma/i, scores: { speed: 6, coding: 9, planning: 5 } },
	{ pattern: /deepseek-r1|qwq|think/i,                     scores: { speed: 4, coding: 8, planning: 10 } },
	{ pattern: /deepseek/i,                                  scores: { speed: 5, coding: 8, planning: 7 } },
	{ pattern: /mistral-large|mixtral/i,                     scores: { speed: 4, coding: 7, planning: 8 } },
	{ pattern: /mistral/i,                                   scores: { speed: 7, coding: 7, planning: 6 } },
	{ pattern: /llama/i,                                     scores: { speed: 7, coding: 7, planning: 6 } },
]

function scoreModel(name: string): ModelScores {
	for (const { pattern, scores } of MODEL_SCORES) {
		if (pattern.test(name)) return scores
	}
	// Fallback: derive from size tag (e.g. :7b, :14b, :70b)
	const sizeMatch = name.match(/:(\d+)b/i)
	const n = sizeMatch ? parseInt(sizeMatch[1], 10) : 7
	if (n <= 4)  return { speed: 9, coding: 6, planning: 5 }
	if (n <= 14) return { speed: 7, coding: 7, planning: 6 }
	if (n <= 34) return { speed: 5, coding: 7, planning: 7 }
	return { speed: 2, coding: 8, planning: 9 }
}

function bar(score: number): string {
	return '█'.repeat(score) + '░'.repeat(10 - score)
}

const INCOMPATIBLE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
	{ pattern: /embed|embedding/i,                              reason: 'embedding model — no chat support' },
	{ pattern: /rerank|reranker/i,                              reason: 'reranking model — no chat support' },
	{ pattern: /nomic-embed|mxbai-embed|all-minilm|bge-/i,     reason: 'embedding model — no chat support' },
	{ pattern: /whisper|bark/i,                                 reason: 'audio model — no chat support' },
	{ pattern: /stable-diffusion|sdxl/i,                        reason: 'image generation model — no chat support' },
	{ pattern: /^clip/i,                                        reason: 'vision encoder — no chat support' },
]

function isStaticallyIncompatible(name: string): string | null {
	for (const { pattern, reason } of INCOMPATIBLE_PATTERNS) {
		if (pattern.test(name)) return reason
	}
	return null
}

function probeLoadedModel(name: string): Promise<'compatible' | 'incompatible'> {
	return new Promise(resolve => {
		const body = JSON.stringify({
			model: name,
			max_tokens: 5,
			messages: [{ role: 'user', content: 'hi' }],
			tools: [{ name: 'ping', description: 'test', input_schema: { type: 'object', properties: {} } }],
		})
		const req = http.request(
			{ hostname: 'localhost', port: 11434, path: '/v1/messages', method: 'POST',
			  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
			res => {
				let data = ''
				res.on('data', chunk => { data += chunk })
				res.on('end', () => {
					try {
						const parsed = JSON.parse(data) as Record<string, unknown>
						resolve(res.statusCode === 200 && !parsed['error'] ? 'compatible' : 'incompatible')
					} catch { resolve('incompatible') }
				})
			}
		)
		req.on('error', () => resolve('incompatible'))
		req.setTimeout(5000, () => { req.destroy(); resolve('incompatible') })
		req.write(body)
		req.end()
	})
}

async function ollamaRecommend(): Promise<void> {
	let models: string[]
	let loadedNames: string[] = []
	try {
		[models] = await Promise.all([fetchOllamaModels()])
		const ps = await ollamaGet('/api/ps').catch(() => ({ models: [] })) as { models?: { name: string }[] }
		loadedNames = (ps.models ?? []).map(m => m.name)
	} catch (err) {
		vscode.window.showErrorMessage(
			`Could not connect to Ollama at http://localhost:11434. Make sure Ollama is running. (${err instanceof Error ? err.message : err})`
		)
		return
	}

	if (models.length === 0) {
		vscode.window.showErrorMessage('Ollama has no models installed. Run `ollama pull <model>` first.')
		return
	}

	// Probe already-loaded models (free — already in VRAM)
	const probeResults = new Map<string, 'compatible' | 'incompatible'>()
	await Promise.all(loadedNames.map(async name => {
		probeResults.set(name, await probeLoadedModel(name))
	}))

	const incompatible: Array<{ name: string; reason: string }> = []
	const compatible: string[] = []
	for (const name of models) {
		const staticReason = isStaticallyIncompatible(name)
		if (staticReason) {
			incompatible.push({ name, reason: staticReason })
			continue
		}
		const probeResult = probeResults.get(name)
		if (probeResult === 'incompatible') {
			incompatible.push({ name, reason: 'tool use probe failed (model loaded)' })
			continue
		}
		compatible.push(name)
	}

	const scored = compatible.map(name => ({ name, ...scoreModel(name) }))
	const pad = (s: string, n: number) => s.padEnd(n)
	const maxLen = Math.max(...models.map(m => m.length), 4)
	const lines: string[] = [
		`Ollama Model Recommendations (${models.length} model${models.length === 1 ? '' : 's'} installed${incompatible.length > 0 ? `, ${incompatible.length} incompatible` : ''})`,
	]

	if (incompatible.length > 0) {
		lines.push('', '  ⚠ Incompatible with Claude Code:')
		for (const { name, reason } of incompatible) lines.push(`  • ${pad(name, maxLen)}  — ${reason}`)
	}

	if (scored.length > 0) {
		const bestSpeed    = scored.reduce((a, b) => b.speed > a.speed ? b : a)
		const bestCoding   = scored.reduce((a, b) => b.coding > a.coding ? b : a)
		const bestPlanning = scored.reduce((a, b) => b.planning > a.planning ? b : a)
		lines.push(
			'', '  ✓ Compatible models ranked:',
			`  Quick responses:  ${pad(bestSpeed.name, maxLen)}  [Speed ${bar(bestSpeed.speed)} ${bestSpeed.speed}  Coding ${bar(bestSpeed.coding)} ${bestSpeed.coding}  Planning ${bar(bestSpeed.planning)} ${bestSpeed.planning}]`,
			`  Coding:           ${pad(bestCoding.name, maxLen)}  [Speed ${bar(bestCoding.speed)} ${bestCoding.speed}  Coding ${bar(bestCoding.coding)} ${bestCoding.coding}  Planning ${bar(bestCoding.planning)} ${bestCoding.planning}]`,
			`  Planning:         ${pad(bestPlanning.name, maxLen)}  [Speed ${bar(bestPlanning.speed)} ${bestPlanning.speed}  Coding ${bar(bestPlanning.coding)} ${bestPlanning.coding}  Planning ${bar(bestPlanning.planning)} ${bestPlanning.planning}]`,
			'', '  All compatible models scored:',
			...scored.map(m => `  • ${pad(m.name, maxLen)}  Speed:${m.speed}  Coding:${m.coding}  Planning:${m.planning}`),
		)

		outputChannel!.clear()
		outputChannel!.appendLine(lines.join('\n'))
		outputChannel!.show()

		const summary = `Best for coding: ${bestCoding.name} | Speed: ${bestSpeed.name} | Planning: ${bestPlanning.name}`
		vscode.window.showInformationMessage(summary, 'Select a Model').then(action => {
			if (action === 'Select a Model') vscode.commands.executeCommand('claudeOverwrite.configureOllama')
		})
	} else {
		lines.push('', '  No compatible models found. Install a chat model with `ollama pull <model>`.')
		outputChannel!.clear()
		outputChannel!.appendLine(lines.join('\n'))
		outputChannel!.show()
		vscode.window.showWarningMessage('No compatible Ollama models found. See output for details.')
	}
}

async function ollamaTestCurrent(): Promise<void> {
	let loadedNames: string[] = []
	try {
		const ps = await ollamaGet('/api/ps') as { models?: { name: string }[] }
		loadedNames = (ps.models ?? []).map(m => m.name)
	} catch {
		vscode.window.showErrorMessage('Could not reach Ollama at http://localhost:11434. Make sure Ollama is running.')
		return
	}

	if (loadedNames.length === 0) {
		vscode.window.showWarningMessage('No model is currently loaded in Ollama. Send a message to Claude Code first to load one, then run this test.')
		return
	}

	const name = loadedNames[0]
	const result = await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: `Testing ${name} for Claude Code compatibility…` },
		() => probeLoadedModel(name)
	)

	const line = result === 'compatible'
		? `✓ ${name} — compatible (tool use works)`
		: `⚠ ${name} — incompatible (tool use probe failed)`

	outputChannel!.appendLine(`\nCompatibility test: ${line}`)
	outputChannel!.show()

	if (result === 'compatible') {
		vscode.window.showInformationMessage(`${name} is compatible with Claude Code.`)
	} else {
		vscode.window.showWarningMessage(`${name} failed the tool-use probe. Claude Code may not work correctly with this model.`)
	}
}

async function revertOllama(): Promise<void> {
	const settings = readClaudeSettings()
	const env = settings.env as Record<string, string> | undefined
	const ollamaKeys = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL']

	if (!env || !ollamaKeys.some(k => k in env)) {
		vscode.window.showInformationMessage('Claude Code is already using the default Anthropic API.')
		return
	}

	for (const key of ollamaKeys) delete env[key]
	if (Object.keys(env).length === 0) delete settings.env
	writeClaudeSettings(settings)

	vscode.window.showInformationMessage(
		'Claude Code reverted to Anthropic API. Reload VS Code to apply.',
		'Reload Window'
	).then(action => {
		if (action === 'Reload Window') {
			vscode.commands.executeCommand('workbench.action.reloadWindow')
		}
	})
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

		vscode.commands.registerCommand('claudeOverwrite.ollamaStatus', () => ollamaStatus()),

		vscode.commands.registerCommand('claudeOverwrite.ollamaRecommend', () => ollamaRecommend()),

		vscode.commands.registerCommand('claudeOverwrite.ollamaTestCurrent', () => ollamaTestCurrent()),

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
