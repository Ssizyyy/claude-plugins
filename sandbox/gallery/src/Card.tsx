import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Preview, stageFor, type PreviewState, type Stage, type StageMode } from './Preview'
import { ReportButton, ReportedChip, useAutoClear, type ReportApi } from './reports'
import { labelOf } from './Cats'
import { assigned, hintFor, type Categories, type CatPatch, type Item, type Pick, type PickStatus, type Rank, type Status, type Weight } from './types'

export const STATUS_STYLE: Record<Status, string> = {
  used: 'bg-info text-info-foreground',
  adopted: 'bg-success text-success-foreground',
  candidate: 'bg-warning text-warning-foreground',
  unreviewed: 'bg-muted text-muted-foreground',
  reported: 'bg-warning/20 text-foreground',
  rejected: 'bg-destructive/15 text-destructive',
  deleted: 'bg-destructive text-white',
}

const ACTIONS: { status: PickStatus; label: string }[] = [
  { status: 'adopted', label: 'Adopt' },
  { status: 'candidate', label: 'Candidate' },
  { status: 'rejected', label: 'Reject' },
  { status: 'deleted', label: 'Delete' },
]

export type PickPatch = { status?: PickStatus | null; note?: string; preferredVariant?: string | null } & CatPatch
export type OnPick = (id: string, patch: PickPatch) => void

export const depList = (item: Item) => item.dependencies.map((d) => d.replace(/@[\^~]?[\d.]+$/, '')).join(', ') || 'no deps'
export const itemHref = (item: Item) => `#/item/${item.source}/${item.key}`

export const CARD_H = 480

export function ScoreTag({ rank }: { rank?: Rank }) {
  if (!rank) return null
  const tone = rank.blank ? 'bg-warning text-warning-foreground' : rank.score >= 4 ? 'bg-success text-success-foreground' : rank.score <= 2.5 ? 'bg-destructive/15 text-destructive' : 'bg-muted'
  return <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium tabular-nums', tone)} title={rank.reason}>{rank.blank ? 'blank · ' : ''}{rank.score.toFixed(1)}</span>
}

// Adopt / Candidate / Reject / Delete plus the note, and the rank hint; shared by the grid card and the detail page.
// shortcuts: A / C / R / D keys act on this item (D asks for a note first); onDone runs after any pick (review queue advances).
export function PickControls({
  item,
  pick,
  rank,
  onPick,
  extra,
  shortcuts,
  onDone,
  noDelete,
}: {
  item: Item
  pick?: Pick
  rank?: Rank
  onPick: OnPick
  extra?: ReactNode
  shortcuts?: boolean
  onDone?: () => void
  noDelete?: boolean // variants are removed with their own Delete, not tombstoned
}) {
  const [note, setNote] = useState(pick?.note ?? '')
  const [needReason, setNeedReason] = useState(false)
  const intent = useRef(false) // D was pressed: Enter in the note box now confirms the delete
  const area = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setNote(pick?.note ?? ''), [pick?.note, item.id])
  useEffect(() => ((intent.current = false), setNeedReason(false)), [item.id])

  const act = (s: PickStatus) => {
    if (s === 'deleted' && pick?.status !== 'deleted' && !note.trim()) {
      setNeedReason(true)
      intent.current = true
      area.current?.focus()
      return
    }
    setNeedReason(false)
    intent.current = false
    onPick(item.id, { status: pick?.status === s ? null : s, note })
    onDone?.()
  }
  const actRef = useRef(act)
  actRef.current = act

  useEffect(() => {
    if (!shortcuts) return
    const keys: Record<string, PickStatus> = { a: 'adopted', c: 'candidate', r: 'rejected', d: 'deleted' }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable], [role="dialog"], [role="menu"]')) || e.metaKey || e.ctrlKey || e.altKey) return
      const s = keys[e.key.toLowerCase()]
      if (s) {
        e.preventDefault()
        actRef.current(s)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [shortcuts])

  const hint = pick?.status ? undefined : hintFor(rank)
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.filter((a) => !noDelete || a.status !== 'deleted').map(({ status: s, label }) => (
          <Button key={s} size="sm" variant={pick?.status === s ? 'default' : 'outline'} aria-pressed={pick?.status === s} onClick={() => act(s)}>
            {label}
            {shortcuts && <kbd className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground">{label[0]}</kbd>}
          </Button>
        ))}
        {hint && (
          <Button size="sm" variant="secondary" onClick={() => onPick(item.id, { status: hint, note })} title={rank?.reason}>
            Accept hint: {hint === 'candidate' ? 'Candidate' : 'Reject'}
          </Button>
        )}
        {extra}
      </div>
      <Textarea
        ref={area}
        value={note}
        rows={2}
        placeholder={needReason ? 'Delete needs a reason: write it, then press Enter' : 'Note'}
        aria-invalid={needReason}
        className="min-h-0 text-sm"
        onChange={(e) => {
          setNote(e.target.value)
          if (e.target.value.trim()) setNeedReason(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && intent.current && note.trim()) {
            e.preventDefault()
            act('deleted')
          } else if (e.key === 'Escape') (e.target as HTMLElement).blur()
        }}
        onBlur={() => note !== (pick?.note ?? '') && onPick(item.id, { note })}
      />
    </>
  )
}

const ACTION_KEYS: Record<string, PickStatus> = { a: 'adopted', c: 'candidate', r: 'rejected', d: 'deleted' }

// Chips on the card: Tone, up to two Roles, status (not shown while unreviewed). Empty means no chip, not a placeholder.
function CardChips({ pick, status, cats, report }: { pick?: Pick; status: Status; cats: Categories; report: ReportApi }) {
  const roles = assigned(pick, 'roles')
  const chip = 'shrink-0 rounded-full border px-2 py-0.5 text-xs'
  const flag = (g: 'tone' | 'roles', id: string) => labelOf(cats, g, id) ?? `⚠ ${id}`
  return (
    <div className="flex min-h-6 items-center gap-1 overflow-hidden whitespace-nowrap">
      {pick?.tone && <span className={cn(chip, 'border-primary bg-primary/10')}>{flag('tone', pick.tone)}</span>}
      {roles.slice(0, 2).map((id) => (
        <span key={id} className={cn(chip, 'bg-muted')}>{flag('roles', id)}</span>
      ))}
      {roles.length > 2 && <span className="shrink-0 text-xs text-muted-foreground">+{roles.length - 2}</span>}
      <ReportedChip api={report} />
      {status !== 'unreviewed' && status !== 'reported' && <span className={cn(chip, 'border-transparent', STATUS_STYLE[status])}>{status}</span>}
    </div>
  )
}

export function Card({
  item,
  status,
  weight,
  pick,
  rank,
  cats,
  selected,
  onSelect,
  onPick,
  stage,
  report,
}: {
  item: Item
  status: Status
  weight: Weight
  pick?: Pick
  rank?: Rank
  cats: Categories
  selected: boolean
  onSelect: (id: string) => void
  onPick: OnPick
  stage: StageMode
  report: ReportApi
}) {
  const [state, setState] = useState<PreviewState>('idle')
  const previewBox = useRef<HTMLDivElement>(null)
  useAutoClear(report, state)
  const [flip, setFlip] = useState(false)
  const base = stageFor(item, stage)
  const shown: Stage = flip ? (base === 'light' ? 'dark' : 'light') : base

  // Delete is a tombstone and needs a reason: reuse the note, else ask.
  const act = (s: PickStatus) => {
    if (s === 'deleted' && pick?.status !== 'deleted') {
      const reason = pick?.note?.trim() || prompt(`Why delete "${item.title}"? (the reason is kept with the tombstone)`)?.trim()
      if (!reason) return
      return onPick(item.id, { status: s, note: reason })
    }
    onPick(item.id, { status: pick?.status === s ? null : s })
  }
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as Element).closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
    const s = ACTION_KEYS[e.key.toLowerCase()]
    if (s) {
      e.preventDefault()
      act(s)
    }
  }

  return (
    <article
      tabIndex={0}
      onKeyDown={onKey}
      style={{ height: CARD_H }}
      className="group flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-3 text-card-foreground shadow-[var(--shadow-sm)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative">
        <div ref={previewBox}>
          <Preview item={item} stage={shown} className="h-96" onState={setState} />
        </div>
        <input type="checkbox" checked={selected} onChange={() => onSelect(item.id)} aria-label={`Select ${item.title}`} className="absolute left-2 top-2 z-10 size-4" />
        {rank && (
          <span className="absolute right-2 top-2 z-10">
            <ScoreTag rank={rank} />
          </span>
        )}
        <div className="absolute inset-x-2 bottom-2 z-10 flex flex-wrap justify-center gap-1 rounded-md bg-background/90 p-1 opacity-0 shadow-sm backdrop-blur motion-safe:transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" data-card-actions>
          {ACTIONS.map(({ status: s, label }) => (
            <Button key={s} size="xs" variant={pick?.status === s ? 'default' : 'outline'} aria-pressed={pick?.status === s} onClick={() => act(s)} title={`${label} (${label[0]})`}>
              {label}
            </Button>
          ))}
          <ReportButton item={item} api={report} size="xs" ctx={() => ({ width: Math.round(previewBox.current?.offsetWidth ?? 0), stage: shown, state })} />
          <Button size="xs" variant="ghost" aria-pressed={flip} onClick={() => setFlip((f) => !f)} title="Flip this preview's background">
            Bg: {shown}
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 items-baseline gap-2">
        <h3 className="min-w-0 truncate font-medium leading-tight" title={item.title}>
          <a href={itemHref(item)} className="hover:underline">
            {item.title}
          </a>
        </h3>
        {weight !== 'basic' && <span className={cn('size-2 shrink-0 self-center rounded-full', weight === 'heavy' ? 'bg-warning' : 'bg-info')} title={`Adds a package (${weight}): ${depList(item)}`} data-package-dot />}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{item.source}</span>
      </div>
      <CardChips pick={pick} status={status} cats={cats} report={report} />
    </article>
  )
}
