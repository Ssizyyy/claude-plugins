import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { depList, PickControls, ScoreTag, STATUS_STYLE, type OnPick } from './Card'
import { CatPalette, Suggestion } from './Cats'
import { stageFor, type PreviewState, type Stage, type StageMode } from './Preview'
import type { Categories, Item, Pick, Picks, Rank, Status, Weight } from './types'
import { useVariants, VariantAside, VariantStage } from './VariantPanel'

const VIEWPORTS = [
  { id: 'mobile', label: 'Mobile 390', width: 390 },
  { id: 'tablet', label: 'Tablet 768', width: 768 },
  { id: 'desktop', label: 'Desktop', width: undefined },
] as const

let lastVp: (typeof VIEWPORTS)[number]['id'] = 'desktop' // kept while stepping through items (the variants state below is per item)

// Only this item renders here, so heavy WebGL items get the whole stage to themselves.
// Keyed by item, so every item starts on its original with its own variants state.
export function Detail(props: Parameters<typeof DetailInner>[0]) {
  return <DetailInner key={props.item.id} {...props} />
}

function DetailInner({
  item,
  status,
  weight,
  pick,
  picks,
  rank,
  cats,
  onPick,
  stage: mode,
  index,
  total,
  queue,
  onDone,
  onBack,
  onStep,
}: {
  item: Item
  status: Status
  weight: Weight
  pick?: Pick
  picks: Picks // all picks: variants are keyed `<item id>#<variant>`
  rank?: Rank
  cats: Categories
  onPick: OnPick
  stage: StageMode
  index: number
  total: number
  queue?: { left: number } // set inside the review queue
  onDone: () => void
  onBack: () => void
  onStep: (d: -1 | 1) => void
}) {
  const [vp, setVp] = useState(lastVp)
  const v = useVariants(item)
  const vNames = v.names
  const vView = v.view
  const setView = v.setView
  const [stage, setStage] = useState<Stage>(stageFor(item, mode))
  const [state, setState] = useState<PreviewState>('idle')
  const tone = cats.groups.find((g) => g.id === 'tone')?.values ?? []
  useEffect(() => setStage(stageFor(item, mode)), [mode, item])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if ((t instanceof Element && t.closest('input, textarea, select, [contenteditable]')) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') onStep(-1)
      else if (e.key === 'ArrowRight') onStep(1)
      else if (e.key === 'Escape') onBack()
      else if (e.key.toLowerCase() === 'v' && vNames.length > 1) setView(vNames[(vNames.indexOf(vView) + 1) % vNames.length])
      else if (/^[1-9]$/.test(e.key) && tone[Number(e.key) - 1]) {
        // 1-9 set the Tone (again to clear); status keys A/C/R/D live in PickControls and advance the queue
        const id = tone[Number(e.key) - 1].id
        onPick(item.id, { tone: pick?.tone === id ? null : id })
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onStep, onBack, onPick, item.id, pick?.tone, tone, vNames, vView, setView])

  const width = VIEWPORTS.find((vw) => vw.id === vp)!.width
  return (
    <div className="flex min-h-screen flex-col" data-detail={item.id}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Button variant="outline" size="sm" onClick={onBack}>
          {queue ? '← Leave queue' : '← Back to grid'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onStep(-1)} disabled={total < 2} aria-label="Previous item">
          ← Prev
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {queue ? 'Queue ' : ''}
          {index + 1} / {total}
        </span>
        {queue && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{queue.left} undecided</span>}
        <Button variant="ghost" size="sm" onClick={() => onStep(1)} disabled={total < 2} aria-label="Next item">
          Next →
        </Button>
        <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
        <div className="flex gap-1" role="group" aria-label="Preview width">
          {VIEWPORTS.map((vw) => (
            <Button key={vw.id} size="sm" variant={vp === vw.id ? 'default' : 'outline'} aria-pressed={vp === vw.id} onClick={() => ((lastVp = vw.id), setVp(vw.id))}>
              {vw.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" aria-pressed={stage === 'dark'} onClick={() => setStage((s) => (s === 'light' ? 'dark' : 'light'))}>
          Bg: {stage}
        </Button>
        <span className="ml-auto hidden text-xs text-muted-foreground lg:block">← → switch item · A adopt · C candidate · R reject · D delete (note) · 1-4 tone · V variants · Esc back</span>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0">
          <VariantStage item={item} v={v} stage={stage} width={width} onState={setState} />
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
          {rank && (
            <div className="rounded border p-2 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <ScoreTag rank={rank} />
                <span className="text-muted-foreground">rank hint</span>
              </div>
              <p>{rank.reason}</p>
              <p className="mt-1 text-muted-foreground">
                {Object.entries(rank.scores).map(([k, v]) => `${k} ${v}`).join(' · ')}
              </p>
            </div>
          )}
          <VariantAside item={item} v={v} stage={stage} picks={picks} cats={cats} onPick={onPick} />
          <PickControls item={item} pick={pick} rank={rank} onPick={onPick} shortcuts onDone={onDone} />
          <Suggestion pick={pick} rank={rank} cats={cats} onApply={(patch) => onPick(item.id, patch)} />
          <CatPalette pick={pick} cats={cats} onChange={(patch) => onPick(item.id, patch)} />
          <details className="text-xs" open={!!item.fetch.error}>
            <summary className="cursor-pointer text-muted-foreground">Fetch details</summary>
            <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2">{JSON.stringify(item.fetch, null, 2)}</pre>
          </details>
        </aside>
      </main>
    </div>
  )
}
