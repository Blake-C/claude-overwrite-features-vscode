#!/usr/bin/env node
/**
 * Deterministic patch health check.
 *
 * For a given Claude Code install directory, reports whether every patch in
 * PATCHES still matches its target file. A patch is "broken" when neither its
 * `from` (unpatched) nor its `to` (already patched) string is present — i.e.
 * the minified code changed shape and the literal needs a human/AI rewrite.
 *
 * Run directly with Node 24+ (native TypeScript support):
 *   node scripts/check-patches.ts [claudeCodeInstallDir]
 *
 * Exit codes: 0 = all healthy, 2 = one or more patches broken, 1 = usage/IO error.
 *
 * No vscode import — reuses the same PATCHES/applyPatch the extension uses.
 */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
	applyPatch,
	getPatchesByTarget,
	WEBVIEW_FILE,
	EXTENSION_FILE,
	PACKAGE_JSON_FILE,
} from '../src/patch-defs.ts'

type Target = 'webview' | 'extension' | 'packageJson'

const TARGET_FILES: Record<Target, string> = {
	webview: WEBVIEW_FILE,
	extension: EXTENSION_FILE,
	packageJson: PACKAGE_JSON_FILE,
}

function compareSemver(a: string, b: string): number {
	const pa = a.split('.').map(Number)
	const pb = b.split('.').map(Number)
	for (let i = 0; i < 3; i++) {
		if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
	}
	return 0
}

/** Resolve the newest installed Claude Code extension directory. */
function findNewestInstallDir(): string | undefined {
	const extRoot = path.join(os.homedir(), '.vscode', 'extensions')
	if (!fs.existsSync(extRoot)) return undefined
	const re = /^anthropic\.claude-code-(\d+\.\d+\.\d+)-/
	let best: { dir: string; version: string } | undefined
	for (const entry of fs.readdirSync(extRoot)) {
		const m = entry.match(re)
		if (!m) continue
		if (!best || compareSemver(m[1], best.version) > 0) {
			best = { dir: path.join(extRoot, entry), version: m[1] }
		}
	}
	return best?.dir
}

function readInstalledVersion(installDir: string): string {
	try {
		return JSON.parse(fs.readFileSync(path.join(installDir, 'package.json'), 'utf8')).version ?? 'unknown'
	} catch {
		return 'unknown'
	}
}

function main(): number {
	const installDir = process.argv[2] ?? findNewestInstallDir()
	if (!installDir) {
		console.error('No Claude Code install directory found under ~/.vscode/extensions.')
		return 1
	}
	if (!fs.existsSync(installDir)) {
		console.error(`Install directory does not exist: ${installDir}`)
		return 1
	}

	const version = readInstalledVersion(installDir)
	console.log(`Patch health check — Claude Code v${version}`)
	console.log(`Install dir: ${installDir}\n`)

	const broken: string[] = []
	let checked = 0

	for (const target of Object.keys(TARGET_FILES) as Target[]) {
		const filePath = path.join(installDir, TARGET_FILES[target])
		const patches = getPatchesByTarget(target)
		if (patches.length === 0) continue

		if (!fs.existsSync(filePath)) {
			for (const patch of patches) {
				broken.push(patch.name)
				console.log(`✗ ${patch.name} (target file missing: ${TARGET_FILES[target]})`)
			}
			continue
		}

		const content = fs.readFileSync(filePath, 'utf8')
		for (const patch of patches) {
			checked++
			const { applied, alreadyPatched } = applyPatch(content, patch)
			if (applied) {
				console.log(`✓ ${patch.name} (matches — would apply)`)
			} else if (alreadyPatched) {
				console.log(`— ${patch.name} (already applied)`)
			} else {
				broken.push(patch.name)
				console.log(`✗ ${patch.name} (pattern not found — needs update)`)
			}
		}
	}

	console.log('')
	if (broken.length > 0) {
		console.log(`RESULT: BROKEN — ${broken.length}/${checked} patch(es) need updating for v${version}.`)
		return 2
	}
	console.log(`RESULT: HEALTHY — all ${checked} patches match v${version}.`)
	return 0
}

process.exit(main())
