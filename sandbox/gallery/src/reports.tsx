import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Item } from './types'
import type { PreviewState, Stage } from './Preview'

declare const __GALLERY_VERSION__: string

export const SYMPTOMS = ['Blank', 'Stuck loading', 'Error shown', 'Looks wrong', 'Other'] as const
export type Symptom = (typeof SYMPTOMS)[number]

// One entry of reports.json (written by the dev server, see data.mjs). History is kept; `status` says what became of it.
export interface Report {
  id: string
  itemId: string
  source: string
  symptom: Symptom
  note?: string
  state: PreviewState // how the preview looked when it was reported
  width: number
  stage: Stage
  page: 'light' | 'dark'
  errors: string[]
  at: string
  version: string
  status: 'open' | 'fixed' | 'wontrender' | 'undone'
  closedAt?: string
  resolution?: string
}
export type ReportDraft = Omit<Report, 'id' | 'at' | 'status'>

export interface ReportApi {
  open: Report[] // open reports of this item
  add: (item: Item, symptom: Symptom, ctx: { width: number; stage: Stage; state: PreviewState }, note?: string) => void
  undo: () => void // drops the latest open report
  fixed: () => void // closes every open report of the item
}

// The last few console errors, kept from page start so a report can say what the preview threw.
const errors: string[] = []
const keep = (m: string) => (errors.push(m.slice(0, 300)), errors.length > 5 && errors.shift())
export function captureConsole() {
  const err = console.error
  console.error = (...a: unknown[]) => (keep(a.map((x) => (x instanceof Error ? x.message : typeof x === 'string' ? x : JSON.stringify(x))).join(' ')), err(...a))
  addEventListener('error', (e) => keep(e.message))
  addEventListener('unhandledrejection', (e) => keep(`unhandled: ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`))
}
export const recentErrors = () => [...errors]
export const galleryVersion = __GALLERY_VERSION__

// What B (no symptom click) records: the symptom the preview shows.
export const symptomFor = (s: PreviewState): Symptom => (s === 'error' ? 'Error shown' : s === 'blank' ? 'Blank' : s === 'loading' ? 'Stuck loading' : 'Other')

// A report that was made while the preview was not rendering clears itself once the preview renders.
export function useAutoClear(api: ReportApi | undefined, state: PreviewState) {
  useEffect(() => {
    const r = api?.open.at(-1)
    if (r && state === 'rendered' && r.state !== 'rendered' && Date.now() > Date.parse(r.at) + 2000) api?.fixed()
  }, [api, state])
}

// Report button with a symptom picker; one click on a symptom files the report.
export function ReportButton({ item, api, ctx, size = 'sm', shortcut }: { item: Item; api: ReportApi; ctx: () => { width: number; stage: Stage; state: PreviewState }; size?: 'sm' | 'xs'; shortcut?: boolean }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const file = (s: Symptom) => (api.add(item, s, ctx(), note.trim() || undefined), setNote(''), setOpen(false))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size={size} variant="outline" title="Report that this does not load (B)" data-report-button>
          Report
          {shortcut && <kbd className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground">B</kbd>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-72 flex-col gap-2 bg-card text-xs text-card-foreground ring-border" data-report-popover>
        <p className="text-muted-foreground">What is wrong? One click files the report.</p>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Report note" className="rounded border bg-background px-2 py-1 text-foreground" />
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOMS.map((s) => (
            <Button key={s} size="xs" variant="outline" onClick={() => file(s)}>
              {s}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// "Reported" chip with undo; the detail page adds a Fixed button.
export function ReportedChip({ api, className, withFixed }: { api: ReportApi; className?: string; withFixed?: boolean }) {
  const last = api.open.at(-1)
  if (!last) return null
  const title = `${last.symptom}${last.note ? `: ${last.note}` : ''}${api.open.length > 1 ? ` (${api.open.length} reports)` : ''}`
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border border-warning bg-warning/20 px-2 py-0.5 text-xs', className)} title={title} data-reported>
      Reported · {last.symptom}
      <button type="button" className="underline" onClick={() => api.undo()}>
        undo
      </button>
      {withFixed && (
        <button type="button" className="underline" onClick={() => api.fixed()}>
          Fixed
        </button>
      )}
    </span>
  )
}
