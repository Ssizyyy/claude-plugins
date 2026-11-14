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
  fetch: { entry?: string; error?: string }
}

export interface Pick {
  status?: PickStatus
  note?: string
  reason?: string
  at?: string
}
export type Picks = Record<string, Pick>

export type Weight = 'basic' | 'extra' | 'heavy'
