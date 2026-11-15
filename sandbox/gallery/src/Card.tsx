import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Preview, stageFor, type Stage, type StageMode } from './Preview'
import { CatChips, Suggestion } from './Cats'
import { hintFor, type Categories, type CatPatch, type Item, type Pick, type PickStatus, type Rank, type Status, type Weight } from './types'

export const STATUS_STYLE: Record<Status, string> = {
  used: 'bg-info text-info-foreground',
  adopted: 'bg-success text-success-foreground',
  candidate: 'bg-warning text-warning-foreground',
  unreviewed: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/15 text-destructive',
  deleted: 'bg-destructive text-white',
}

const ACTIONS: { status: PickStatus; label: string }[] = [
  { status: 'adopted', label: 'Adopt' },
  { status: 'candidate', label: 'Candidate' },
  { status: 'rejected', label: 'Reject' },
  { status: 'deleted', label: 'Delete' },
]

export type PickPatch = { status?: PickStatus | null; note?: string } & CatPatch
export type OnPick = (id: string, patch: PickPatch) => void

export const depList = (item: Item) => item.dependencies.map((d) => d.replace(/@[\^~]?[\d.]+$/, '')).join(', ') || 'no deps'
export const itemHref = (item: Item) => `#/item/${item.source}/${item.key}`

export const CARD_H = 700

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
}: {
  item: Item
  pick?: Pick
  rank?: Rank
  onPick: OnPick
  extra?: ReactNode
  shortcuts?: boolean
  onDone?: () => void
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
      if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) || e.metaKey || e.ctrlKey || e.altKey) return
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
        {ACTIONS.map(({ status: s, label }) => (
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
}) {
  const [flip, setFlip] = useState(false)
  const base = stageFor(item, stage)
  const shown: Stage = flip ? (base === 'light' ? 'dark' : 'light') : base

  return (
    <article style={{ height: CARD_H }} className="flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-3 text-card-foreground shadow-[var(--shadow-sm)]">
      <Preview item={item} stage={shown} className="h-96" />
      <header className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <input type="checkbox" checked={selected} onChange={() => onSelect(item.id)} aria-label={`Select ${item.title}`} className="size-4" />
          <Badge className={cn('border-transparent', STATUS_STYLE[status])}>{status}</Badge>
          {pick?.status && <span className="text-xs text-muted-foreground">picked</span>}
          <span className="ml-auto text-xs text-muted-foreground">{item.source}</span>
        </div>
        <h3 className="font-medium leading-tight">
          <a href={itemHref(item)} className="hover:underline">
            {item.title}
          </a>
        </h3>
        <code className="text-xs text-muted-foreground">{item.key}</code>
        <CatChips pick={pick} cats={cats} />
        <Suggestion pick={pick} rank={rank} cats={cats} onApply={(patch) => onPick(item.id, patch)} />
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description || 'No description'}</p>
        {rank && <p title={rank.reason} className="line-clamp-2 text-xs text-muted-foreground">rank: {rank.reason}</p>}
        <p className="text-xs text-muted-foreground">
          <span className={cn('mr-1.5 rounded px-1 py-0.5', weight === 'heavy' ? 'bg-warning text-warning-foreground' : 'bg-muted')}>{weight}</span>
          {depList(item)}
        </p>
        {item.note && <p title={item.note} className="line-clamp-2 text-xs italic text-muted-foreground">catalog: {item.note}</p>}
      </header>
      <PickControls
        item={item}
        pick={pick}
        onPick={onPick}
        extra={
          <span className="ml-auto flex gap-1.5">
            <Button size="sm" variant="ghost" aria-pressed={flip} onClick={() => setFlip((f) => !f)} title="Flip this preview's background">
              Bg: {shown}
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href={itemHref(item)}>Open</a>
            </Button>
          </span>
        }
      />
    </article>
  )
}
