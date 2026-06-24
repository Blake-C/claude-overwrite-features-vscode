import * as path from 'path'

export const STATE_KEY_PATCHED_VERSION = 'patchedClaudeCodeVersion'
export const WEBVIEW_FILE = path.join('webview', 'index.js')
export const EXTENSION_FILE = 'extension.js'
export const PACKAGE_JSON_FILE = 'package.json'
export const BACKUP_SUFFIX = '.backup'

export interface Patch {
	name: string
	from: string
	to: string
	targetFile?: 'webview' | 'extension' | 'packageJson'
}

export const PATCHES: Patch[] = [
	{
		name: 'Feature 1: Default include-file toggle to OFF',
		from: '_=Ie(!0),[C,x]=oe(!0),[y,w]=oe(!1)',
		to: '_=Ie(!0),[C,x]=oe(!1),[y,w]=oe(!1)',
	},
	{
		name: 'Feature 2: Skip attachments + reset toggle on slash commands',
		from: 'await e.send(K,h,bt),p([]),DM(r,!0)',
		to: 'await e.send(K,Ne?[]:h,bt),p([]),x(!1),DM(r,!0)',
	},
	{
		name: 'Feature 3: Confirm before compacting',
		from: 'click to compact`,onClick:i,onMouseEnter:',
		to: 'click to compact`,onClick:()=>{const d=document.createElement("dialog");d.style.cssText="background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);border:1px solid var(--vscode-widget-border,#454545);border-radius:6px;padding:20px;min-width:260px;box-shadow:0 4px 16px rgba(0,0,0,.4);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size,13px)";d.innerHTML=\'<form method="dialog" style="margin:0"><p style="margin:0 0 16px;line-height:1.5">Compact conversation now?<br>This cannot be undone.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button value="cancel" style="padding:4px 14px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;border-radius:3px;cursor:pointer;font:inherit">Cancel</button><button value="ok" autofocus style="padding:4px 14px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:3px;cursor:pointer;font:inherit">Compact</button></div></form>\';document.body.appendChild(d);d.showModal();d.addEventListener("close",()=>{if(d.returnValue==="ok")i();d.remove()})},onMouseEnter:',
	},
	{
		name: 'Feature 4: Respect ~/.claude/settings.json permissions in plan mode',
		targetFile: 'extension',
		from: 'return{behavior:"allow",updatedInput:r};let o=await this.sendRequest(e,{type:"tool_permission_request",toolName:t,inputs:r,suggestions:i},n);return Eoe(t,o),o.result}',
		to: 'return{behavior:"allow",updatedInput:r};try{const _fs=require("fs"),_cs=JSON.parse(_fs.readFileSync(require("path").join(require("os").homedir(),".claude","settings.json"),"utf8")),_al=_cs?.permissions?.allow??[],_dl=_cs?.permissions?.deny??[],_mn=(p)=>{const _m=p.match(/^(\\w+)\\((.+)\\)$/);if(!_m)return p===t;if(_m[1]!==t)return!1;const c=typeof r==="object"&&r!==null?r.command??r.cmd??r.input??JSON.stringify(r):"";return new RegExp("^"+_m[2].replace(/\\*/g,".*")+"$").test(c)};if(!_dl.some(_mn)&&_al.some(_mn))return{behavior:"allow",updatedInput:r}}catch(_e){}let o=await this.sendRequest(e,{type:"tool_permission_request",toolName:t,inputs:r,suggestions:i},n);return Eoe(t,o),o.result}',
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

export function getPatchesByTarget(target: 'webview' | 'extension' | 'packageJson'): Patch[] {
	if (target === 'webview') return PATCHES.filter(p => !p.targetFile || p.targetFile === 'webview')
	return PATCHES.filter(p => p.targetFile === target)
}
