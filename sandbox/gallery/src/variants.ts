import type { CSSProperties } from 'react'
import type { Item } from './types'

// ---------- tokens ----------
export const COLOR_KEYS = ['background', 'foreground', 'primary', 'accent', 'muted', 'border', 'destructive'] as const
export type ColorKey = (typeof COLOR_KEYS)[number]
export interface Tokens extends Partial<Record<ColorKey, string>> {
  radius?: number // rem, the size of "rounded-lg"
  font?: string
  spacing?: number // rem, Tailwind's base unit (default 0.25)
  scale?: number // overall zoom
}
export const DEFAULTS = { radius: 0.5, spacing: 0.25, scale: 1 }
const RADII: Record<string, number> = { xs: 0.125, sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, '2xl': 1, '3xl': 1.5, '4xl': 2 }

// CSS variables on the preview stage: shadcn-style classes (bg-primary, rounded-lg, p-4) read them at use site.
export function tokenStyle(t: Tokens = {}): CSSProperties {
  const s: Record<string, string | number> = {}
  for (const k of COLOR_KEYS) if (t[k]) s[`--${k}`] = t[k]!
  if (t.background) {
    s.backgroundColor = t.background
    s.color = t.foreground ?? 'var(--foreground)'
  } else if (t.foreground) s.color = t.foreground
  if (t.radius != null) for (const [n, r] of Object.entries(RADII)) s[`--radius-${n}`] = `${(r * t.radius) / DEFAULTS.radius}rem`
  if (t.spacing != null) s['--spacing'] = `${t.spacing}rem`
  if (t.font) {
    s['--font-sans'] = t.font
    s.fontFamily = t.font
  }
  if (t.scale != null && t.scale !== 1) s.zoom = t.scale
  return s as CSSProperties
}
export const hasTokens = (t: Tokens = {}) => Object.keys(t).length > 0

export const FONTS = [
  { label: 'Geist (gallery)', value: '"Geist Variable", sans-serif' },
  { label: 'System sans', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, "Cascadia Code", Consolas, monospace' },
  { label: 'Rounded', value: 'ui-rounded, "Segoe UI Variable", system-ui, sans-serif' },
]

// A preset is a set of tokens per stage (colours that suit a light stage look wrong on a dark one).
export const PRESETS: { id: string; label: string; light: Tokens; dark: Tokens }[] = [
  { id: 'warm', label: 'Warm', light: { background: '#fbf6ee', foreground: '#3b2a1a', primary: '#c2410c', accent: '#fde7c8', muted: '#f2e8d8', border: '#e5d5bd', destructive: '#b91c1c', radius: 0.75 }, dark: { background: '#1c1410', foreground: '#f5e9d8', primary: '#fb923c', accent: '#3a2a1d', muted: '#2a1f17', border: '#4a3626', destructive: '#f87171', radius: 0.75 } },
  { id: 'cool', label: 'Cool', light: { background: '#f4f8fc', foreground: '#10233a', primary: '#2563eb', accent: '#dbeafe', muted: '#e6eef7', border: '#cddbeb', destructive: '#dc2626', radius: 0.5 }, dark: { background: '#0b1522', foreground: '#e2ecf8', primary: '#60a5fa', accent: '#17304d', muted: '#12233a', border: '#233a58', destructive: '#f87171', radius: 0.5 } },
  { id: 'mono', label: 'Mono', light: { background: '#ffffff', foreground: '#111111', primary: '#111111', accent: '#ececec', muted: '#f4f4f4', border: '#d4d4d4', destructive: '#111111', radius: 0 }, dark: { background: '#0a0a0a', foreground: '#f5f5f5', primary: '#f5f5f5', accent: '#262626', muted: '#171717', border: '#404040', destructive: '#f5f5f5', radius: 0 } },
  { id: 'contrast', label: 'High contrast', light: { background: '#ffffff', foreground: '#000000', primary: '#0000cc', accent: '#fff3a3', muted: '#e8e8e8', border: '#000000', destructive: '#b00000' }, dark: { background: '#000000', foreground: '#ffffff', primary: '#7fb0ff', accent: '#4a4300', muted: '#1a1a1a', border: '#ffffff', destructive: '#ff7b7b' } },
  { id: 'soft', label: 'Soft & round', light: { radius: 1.25, spacing: 0.28, font: FONTS[4].value }, dark: { radius: 1.25, spacing: 0.28, font: FONTS[4].value } },
  { id: 'compact', label: 'Compact', light: { radius: 0.25, spacing: 0.2, scale: 0.9 }, dark: { radius: 0.25, spacing: 0.2, scale: 0.9 } },
]

// ---------- api ----------
export interface VariantMeta {
  parent?: string
  created?: string
  updated?: string
  note?: string
  from?: string
  entry?: string
}
export interface Variant {
  name: string
  meta: VariantMeta
  tokens: Tokens
}
export interface VariantList {
  variants: Variant[]
  draft: boolean
  draftDirty: boolean
  dir: string
}
export interface SnapFile {
  path: string
  editable: boolean
  content: string
}
export interface Snap {
  slot: string
  dir: string // absolute folder of the files (the working copy, or the original)
  files: SnapFile[]
  tokens: Tokens
  dirty: boolean
}
export interface PlanFile {
  rel: string
  exists: boolean
  same: boolean
  existing: string
  incoming: string
  binary: boolean
}
export interface Plan {
  name: string
  folder: string
  entry: string
  deps: string[]
  shadcn: string[]
  tokensCss: string
  scope: string
  project: string
  dest: string
  basis: string
  files: PlanFile[]
  install: string
  usage: string
  prompt: string
  variantPath: string
}
export interface Written {
  written: string[]
  kept: string[]
  same: string[]
  plan: Plan
}

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error ?? r.statusText)
  return j
}
const q = (item: Item, extra: Record<string, string> = {}) => new URLSearchParams({ source: item.source, key: item.key, ...extra }).toString()
const op = <T,>(item: Pick<Item, 'source' | 'key'>, o: string, rest: Record<string, unknown> = {}) => call<T>('/api/v', { op: o, source: item.source, key: item.key, ...rest })

export const api = {
  list: (item: Item) => call<VariantList>(`/api/v/list?${q(item)}`),
  files: (item: Item, slot: string) => call<Snap>(`/api/v/files?${q(item, { slot })}`),
  settings: () => call<{ project: string; recent: string[] }>('/api/v/settings'),
  draft: (item: Item, fresh = false) => op<VariantList>(item, 'draft', { fresh }),
  file: (item: Item, slot: string, path: string, content: string) => op<{ dirty: boolean }>(item, 'file', { slot, path, content }),
  tokens: (item: Item, slot: string, tokens: Tokens) => op<{ dirty: boolean }>(item, 'tokens', { slot, tokens }),
  discard: (item: Item, slot: string) => op<VariantList>(item, 'discard', { slot }),
  save: (item: Item, slot: string, name: string, note?: string) => op<VariantList>(item, 'save', { slot, name, note }),
  rename: (item: Item, name: string, to: string) => op<VariantList>(item, 'rename', { name, to }),
  duplicate: (item: Item, name: string, to: string) => op<VariantList>(item, 'duplicate', { name, to }),
  remove: (item: Item, name: string) => op<VariantList>(item, 'delete', { name }),
  project: (project: string) => op<{ project: string; recent: string[] }>({ source: '', key: '' }, 'project', { project }),
  plan: (item: Item, name: string, project: string, dest: string | undefined, props: unknown) => op<Plan>(item, 'plan', { name, project, dest, itemDeps: item.dependencies, props, title: item.title }),
  write: (item: Item, name: string, project: string, dest: string | undefined, props: unknown, overwrite: string[]) => op<Written>(item, 'write', { name, project, dest, itemDeps: item.dependencies, props, title: item.title, overwrite }),
}

// ---------- prompts ----------
const RULES = [
  'Edit only the files listed above. They are a gitignored working copy; never touch src/items/ (the untouched original) or anything under plugins/.',
  'The source is third-party (React Bits is MIT + Commons Clause): do not commit it, do not move it into tracked folders, and do not paste it into the repo or a PR.',
  'The page reloads live (Vite HMR). Do not start, stop or restart servers, and do not launch other tools.',
  'Simplest change that works. Keep the existing props and exports. Prefer the shadcn tokens (bg-background, text-foreground, bg-primary, border-border, rounded-lg) so the token panel still applies.',
  'Respect prefers-reduced-motion. Add no npm dependency without asking; never run npm install.',
]
export function describePrompt(item: Item, slotLabel: string, snap: Snap, instruction: string) {
  const entry = item.fetch.entry
  const code = snap.files.filter((f) => /\.(tsx?|jsx?|css)$/.test(f.path)).sort((a, b) => Number(b.path === entry) - Number(a.path === entry))
  const sep = snap.dir.includes('\\') ? '\\' : '/'
  const lines = [
    `Change the local variant "${slotLabel}" of ${item.title} (${item.id}).`,
    '',
    'Change wanted:',
    instruction.trim() || '(describe the change here)',
    '',
    'Files (edit these):',
    ...code.slice(0, 40).map((f) => `- ${snap.dir}${sep}${f.path.split('/').join(sep)}${f.path === entry ? '  (entry)' : ''}`),
  ]
  if (code.length > 40) lines.push(`- … ${code.length - 40} more in the same folder`)
  lines.push(
    '',
    `Token overrides (colours, radius, font, spacing, scale) are in ${snap.dir.replace(/[\\/]files$/, '')}${sep}tokens.json; change them there only if the request is about theme values.`,
    '',
    'Rules:',
    ...RULES.map((r) => `- ${r}`),
    '',
    'When done, say which files you changed and what you did in two or three lines.',
  )
  return lines.join('\n')
}

export const slug = (s: string) => s.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 48)
export const variantPickId = (item: Item, name: string) => `${item.id}#${name}`
