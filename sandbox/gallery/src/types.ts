// 'reported' is derived, never stored: an unreviewed item with an open report counts as having a status
export type Status = 'used' | 'adopted' | 'candidate' | 'unreviewed' | 'reported' | 'rejected' | 'deleted'
export type PickStatus = 'adopted' | 'candidate' | 'rejected' | 'deleted'

export interface Item {
  id: string
  source: string
  key: string
  title: string
  description: string
  family: string
  dependencies: string[]
  install: string
  status: Exclude<Status, 'deleted' | 'reported'>
  surface?: 'app' | 'marketing' | 'both'
  motion?: string
  note?: string
  fetch: { entry?: string; error?: string; needs?: string }
}

export interface Pick {
  status?: PickStatus
  note?: string
  reason?: string
  // user-set categories: ids from categories.json (an id that was later removed stays, shown as flagged)
  tone?: string
  roles?: string[]
  preferredVariant?: string // on an item: the variant design-pass should use
  at?: string
}
export type Picks = Record<string, Pick>

export type Weight = 'basic' | 'extra' | 'heavy'

// /gallery-rank output (ranking.json). A hint only: picks always win.
export interface Rank {
  id: string
  score: number
  scores: Partial<Record<'appFit' | 'a11y' | 'depCost' | 'polish' | 'unique', number>>
  reason: string
  blank: boolean
  // a proposed tone and roles for the user to accept with one click; never applied on its own
  suggested?: { tone?: string; roles?: string[]; reason?: string }
}
export type Ranking = Record<string, Rank>

// What one click on the hint button would set. Middle scores give no hint.
export const hintFor = (r?: Rank): PickStatus | undefined => (!r ? undefined : r.blank || r.score <= 2.5 ? 'rejected' : r.score >= 4 ? 'candidate' : undefined)

export const fetchState = (i: Item) => (!i.fetch.error ? 'ok' : i.fetch.error.startsWith('not fetched') ? 'not fetched' : 'failed')

// categories.json: two fixed groups, each an ordered list of values the user edits in the manager screen.
export type GroupId = 'tone' | 'roles'
export const GROUP_IDS: GroupId[] = ['tone', 'roles']
export interface CatValue {
  id: string
  label: string
  surface?: 'app' | 'marketing' // a Tone with this overrides the item's own surface tag
  rule?: string
}
export interface CatGroup {
  id: GroupId
  label: string
  multi: boolean
  values: CatValue[]
}
export interface Categories {
  groups: CatGroup[]
}
export const assigned = (p: Pick | undefined, g: GroupId): string[] => (g === 'tone' ? (p?.tone ? [p.tone] : []) : (p?.[g] ?? []))
export const uncategorized = (p?: Pick) => !p?.tone && !p?.roles?.length

// What one patch to /api/picks looks like for category changes.
export interface CatPatch {
  tone?: string | null
  roles?: string[]
  add?: { roles?: string[] }
}
