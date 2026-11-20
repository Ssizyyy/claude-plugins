import type { Item } from './types'

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
  'Simplest change that works. Keep the existing props and exports. Prefer the shadcn tokens (bg-background, text-foreground, bg-primary, border-border, rounded-lg).',
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
    'Rules:',
    ...RULES.map((r) => `- ${r}`),
    '',
    'When done, say which files you changed and what you did in two or three lines.',
  )
  return lines.join('\n')
}

export const slug = (s: string) => s.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 48)
export const variantPickId = (item: Item, name: string) => `${item.id}#${name}`
