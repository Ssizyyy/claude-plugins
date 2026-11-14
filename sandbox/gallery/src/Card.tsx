import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Preview } from './Preview'
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

export function Card({
  item,
  status,
  weight,
  pick,
  onPick,
}: {
  item: Item
  status: Status
  weight: Weight
  pick?: Pick
  onPick: (id: string, patch: { status?: PickStatus | null; note?: string }) => void
}) {
  const [note, setNote] = useState(pick?.note ?? '')
  const [needReason, setNeedReason] = useState(false)
  useEffect(() => setNote(pick?.note ?? ''), [pick?.note])

  const act = (s: PickStatus) => {
    if (s === 'deleted' && pick?.status !== 'deleted' && !note.trim()) return setNeedReason(true)
    setNeedReason(false)
    onPick(item.id, { status: pick?.status === s ? null : s, note })
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-[var(--shadow-sm)]">
      <Preview item={item} />
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cn('border-transparent', STATUS_STYLE[status])}>{status}</Badge>
          {pick?.status && <span className="text-xs text-muted-foreground">picked</span>}
          <span className="ml-auto text-xs text-muted-foreground">{item.source}</span>
        </div>
        <h3 className="font-medium leading-tight">{item.title}</h3>
        <code className="text-xs text-muted-foreground">{item.key}</code>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          <span className={cn('mr-1.5 rounded px-1 py-0.5', weight === 'heavy' ? 'bg-warning text-warning-foreground' : 'bg-muted')}>{weight}</span>
          {item.dependencies.map((d) => d.replace(/@[\^~]?[\d.]+$/, '')).join(', ') || 'no deps'}
        </p>
        {item.note && <p title={item.note} className="line-clamp-2 text-xs italic text-muted-foreground">catalog: {item.note}</p>}
      </header>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ status: s, label }) => (
          <Button key={s} size="sm" variant={pick?.status === s ? 'default' : 'outline'} aria-pressed={pick?.status === s} onClick={() => act(s)}>
            {label}
          </Button>
        ))}
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
    </article>
  )
}
