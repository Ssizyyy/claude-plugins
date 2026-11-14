export type Status = 'used' | 'adopted' | 'candidate' | 'unreviewed' | 'rejected' | 'deleted'
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
  status: Exclude<Status, 'deleted'>
  surface?: 'app' | 'marketing' | 'both'
  motion?: string
  note?: string
  fetch: { entry?: string; error?: string; needs?: string }
}

export interface Pick {
  status?: PickStatus
  note?: string
  reason?: string
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
}
export type Ranking = Record<string, Rank>

// What one click on the hint button would set. Middle scores give no hint.
export const hintFor = (r?: Rank): PickStatus | undefined => (!r ? undefined : r.blank || r.score <= 2.5 ? 'rejected' : r.score >= 4 ? 'candidate' : undefined)

export const fetchState = (i: Item) => (!i.fetch.error ? 'ok' : i.fetch.error.startsWith('not fetched') ? 'not fetched' : 'failed')
