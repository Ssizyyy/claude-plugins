import { useEffect, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Preview, stageFor, type Stage, type StageMode } from './Preview'
import type { Item, Pick, PickStatus, Status, Weight } from './types'

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

export type OnPick = (id: string, patch: { status?: PickStatus | null; note?: string }) => void

export const depList = (item: Item) => item.dependencies.map((d) => d.replace(/@[\^~]?[\d.]+$/, '')).join(', ') || 'no deps'
export const itemHref = (item: Item) => `#/item/${item.source}/${item.key}`

// Adopt / Candidate / Reject / Delete plus the note; shared by the grid card and the detail page.
export function PickControls({ item, pick, onPick, extra }: { item: Item; pick?: Pick; onPick: OnPick; extra?: ReactNode }) {
  const [note, setNote] = useState(pick?.note ?? '')
  const [needReason, setNeedReason] = useState(false)
  useEffect(() => setNote(pick?.note ?? ''), [pick?.note, item.id])

  const act = (s: PickStatus) => {
    if (s === 'deleted' && pick?.status !== 'deleted' && !note.trim()) return setNeedReason(true)
    setNeedReason(false)
    onPick(item.id, { status: pick?.status === s ? null : s, note })
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ status: s, label }) => (
          <Button key={s} size="sm" variant={pick?.status === s ? 'default' : 'outline'} aria-pressed={pick?.status === s} onClick={() => act(s)}>
            {label}
          </Button>
        ))}
        {extra}
      </div>
      <Textarea
        value={note}
        rows={2}
        placeholder={needReason ? 'Delete needs a reason: write it here' : 'Note'}
        aria-invalid={needReason}
        className="min-h-0 text-sm"
        onChange={(e) => {
          setNote(e.target.value)
          if (e.target.value.trim()) setNeedReason(false)
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
  onPick,
  stage,
}: {
  item: Item
  status: Status
  weight: Weight
  pick?: Pick
  onPick: OnPick
  stage: StageMode
}) {
  const [flip, setFlip] = useState(false)
  const base = stageFor(item, stage)
  const shown: Stage = flip ? (base === 'light' ? 'dark' : 'light') : base

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-[var(--shadow-sm)]">
      <Preview item={item} stage={shown} className="h-96" />
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
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
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
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
