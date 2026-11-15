import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { depList, PickControls, STATUS_STYLE, type OnPick } from './Card'
import { Preview, stageFor, type PreviewState, type Stage, type StageMode } from './Preview'
import type { Item, Pick, Status, Weight } from './types'

const VIEWPORTS = [
  { id: 'mobile', label: 'Mobile 390', width: 390 },
  { id: 'tablet', label: 'Tablet 768', width: 768 },
  { id: 'desktop', label: 'Desktop', width: undefined },
] as const

// Only this item renders here, so heavy WebGL items get the whole stage to themselves.
export function Detail({
  item,
  status,
  weight,
  pick,
  onPick,
  stage: mode,
  index,
  total,
  onBack,
  onStep,
}: {
  item: Item
  status: Status
  weight: Weight
  pick?: Pick
  onPick: OnPick
  stage: StageMode
  index: number
  total: number
  onBack: () => void
  onStep: (d: -1 | 1) => void
}) {
  const [vp, setVp] = useState<(typeof VIEWPORTS)[number]['id']>('desktop')
  const [stage, setStage] = useState<Stage>(stageFor(item, mode))
  const [state, setState] = useState<PreviewState>('idle')
  useEffect(() => setStage(stageFor(item, mode)), [mode, item])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') onStep(-1)
      else if (e.key === 'ArrowRight') onStep(1)
      else if (e.key === 'Escape') onBack()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onStep, onBack])

  const width = VIEWPORTS.find((v) => v.id === vp)!.width
  return (
    <div className="flex min-h-screen flex-col" data-detail={item.id}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back to grid
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onStep(-1)} disabled={total < 2} aria-label="Previous item">
          ← Prev
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onStep(1)} disabled={total < 2} aria-label="Next item">
          Next →
        </Button>
        <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
        <div className="flex gap-1" role="group" aria-label="Preview width">
          {VIEWPORTS.map((v) => (
            <Button key={v.id} size="sm" variant={vp === v.id ? 'default' : 'outline'} aria-pressed={vp === v.id} onClick={() => setVp(v.id)}>
              {v.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" aria-pressed={stage === 'dark'} onClick={() => setStage((s) => (s === 'light' ? 'dark' : 'light'))}>
          Bg: {stage}
        </Button>
        <span className="ml-auto hidden text-xs text-muted-foreground lg:block">← → switch item, Esc back</span>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0">
          <Preview key={item.id} item={item} stage={stage} width={width} eager onState={setState} className="h-[calc(100vh-9rem)] min-h-[24rem]" />
        </section>

        <aside className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn('border-transparent', STATUS_STYLE[status])}>{status}</Badge>
            {pick?.status && <span className="text-xs text-muted-foreground">picked</span>}
            <span className="ml-auto text-xs text-muted-foreground" data-preview-state={state}>
              {item.source} / {item.family}
            </span>
          </div>
          <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
          <code className="text-xs text-muted-foreground">{item.key}</code>
          <p className="text-muted-foreground">{item.description}</p>
          <dl className="grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Deps</dt>
            <dd>
              <span className={cn('mr-1.5 rounded px-1 py-0.5', weight === 'heavy' ? 'bg-warning text-warning-foreground' : 'bg-muted')}>{weight}</span>
              {depList(item)}
            </dd>
            <dt className="text-muted-foreground">Surface</dt>
            <dd>{item.surface ?? 'untagged'}</dd>
            <dt className="text-muted-foreground">Motion</dt>
            <dd>{item.motion ?? 'untagged'}</dd>
            <dt className="text-muted-foreground">Install</dt>
            <dd>
              <code className="break-all">{item.install}</code>
            </dd>
          </dl>
          {item.note && <p className="text-xs italic text-muted-foreground">catalog: {item.note}</p>}
          {pick?.reason && <p className="text-xs text-destructive">Deleted: {pick.reason}</p>}
          <PickControls item={item} pick={pick} onPick={onPick} />
          <details className="text-xs" open={!!item.fetch.error}>
            <summary className="cursor-pointer text-muted-foreground">Fetch details</summary>
            <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2">{JSON.stringify(item.fetch, null, 2)}</pre>
          </details>
        </aside>
      </main>
    </div>
  )
}
