import * as vscode from 'vscode'
import * as fs from 'fs'
import * as http from 'http'
import * as os from 'os'
import * as path from 'path'

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json')

export function readClaudeSettings(): Record<string, unknown> {
	if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) return {}
	try {
		return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'))
	} catch {
		return {}
	}
}

export function writeClaudeSettings(settings: Record<string, unknown>): void {
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

export async function configureOllama(): Promise<void> {
	let models: string[]
	try {
		models = await fetchOllamaModels()
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

	const items: vscode.QuickPickItem[] = models.map(name => {
		const staticReason = isStaticallyIncompatible(name)
		const scores = scoreModel(name)
		const scoreStr = `Speed:${scores.speed}  Coding:${scores.coding}  Planning:${scores.planning}`

		if (staticReason) {
			return { label: `⚠ ${name}`, description: `incompatible — ${staticReason}`, detail: '(selectable, but likely broken with Claude Code)' }
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

export async function ollamaStatus(outputChannel: vscode.OutputChannel): Promise<void> {
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

	outputChannel.clear()
	outputChannel.appendLine(lines.join('\n'))
	outputChannel.show()

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

export async function ollamaRecommend(outputChannel: vscode.OutputChannel): Promise<void> {
	let models: string[]
	try {
		models = await fetchOllamaModels()
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

	const incompatible: Array<{ name: string; reason: string }> = []
	const compatible: string[] = []
	for (const name of models) {
		const staticReason = isStaticallyIncompatible(name)
		if (staticReason) {
			incompatible.push({ name, reason: staticReason })
		} else {
			compatible.push(name)
		}
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

		outputChannel.clear()
		outputChannel.appendLine(lines.join('\n'))
		outputChannel.show()

		const summary = `Best for coding: ${bestCoding.name} | Speed: ${bestSpeed.name} | Planning: ${bestPlanning.name}`
		vscode.window.showInformationMessage(summary, 'Select a Model').then(action => {
			if (action === 'Select a Model') vscode.commands.executeCommand('claudeOverwrite.configureOllama')
		})
	} else {
		lines.push('', '  No compatible models found. Install a chat model with `ollama pull <model>`.')
		outputChannel.clear()
		outputChannel.appendLine(lines.join('\n'))
		outputChannel.show()
		vscode.window.showWarningMessage('No compatible Ollama models found. See output for details.')
	}
}

export async function revertOllama(): Promise<void> {
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
