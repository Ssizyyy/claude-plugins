import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Card, STATUS_STYLE } from './Card'
import { Detail } from './Detail'
import { Grid } from './Grid'
import type { StageMode } from './Preview'
import { fetchState, type Item, type Picks, type PickStatus, type Ranking, type Status, type Weight } from './types'

const STATUSES: Status[] = ['unreviewed', 'candidate', 'adopted', 'used', 'rejected', 'deleted']
const SURFACES = ['app', 'marketing', 'both', 'untagged'] as const
const WEIGHTS: Weight[] = ['basic', 'extra', 'heavy']
const FETCHES = ['ok', 'failed', 'not fetched'] as const
const SORTS = ['name', 'status', 'score'] as const
type Sort = (typeof SORTS)[number]
const BASIC = new Set(['clsx', 'tailwind-merge', 'react', 'react-dom', 'lucide-react', 'class-variance-authority', 'radix-ui', 'cn'])
const HEAVY = ['gsap', 'ogl', 'three', 'matter-js', 'lenis', 'vgpu', '@react-three']
// worked-through statuses are hidden by default; the unread pool is what needs a decision
const DEFAULT_STATUSES: Status[] = ['unreviewed', 'candidate']

const depName = (d: string) => d.replace(/@[\^~]?[\d.]+$|@latest$/, '')
function weightOf(item: Item): Weight {
  const deps = item.dependencies.map(depName)
  if (deps.some((d) => HEAVY.some((h) => d === h || d.startsWith(h)))) return 'heavy'
  return deps.every((d) => BASIC.has(d)) ? 'basic' : 'extra'
}

const toggle = <T,>(set: Set<T>, v: T) => {
  const n = new Set(set)
  if (!n.delete(v)) n.add(v)
  return n
}

// Saved filters: everything the user set up in the sidebar and chips, kept in localStorage.
const FILTER_KEY = 'gallery:filters:v1'
interface Saved {
  q: string
  source: string
  family: string
  statuses: Status[]
  surfaces: string[]
  weights: Weight[]
  fetches: string[]
  sort: Sort
  minScore: number
  stage: StageMode
}
const loadSaved = (): Partial<Saved> => {
  try {
    return JSON.parse(localStorage.getItem(FILTER_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs motion-safe:transition-colors',
        on ? (className ?? 'border-primary bg-primary text-primary-foreground') : 'text-muted-foreground line-through opacity-70 hover:opacity-100',
      )}
    >
      {children}
    </button>
  )
}

function SideButton({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded px-2 py-1 text-left motion-safe:transition-colors [&_em]:text-xs [&_em]:not-italic [&_em]:text-muted-foreground',
        on ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

const STATUS_ORDER: Record<Status, number> = { unreviewed: 0, candidate: 1, adopted: 2, used: 3, rejected: 4, deleted: 5 }

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [picks, setPicks] = useState<Picks>({})
  const [ranking, setRanking] = useState<Ranking>({})
  const [loadError, setLoadError] = useState('')
  const saved = useMemo(loadSaved, [])
  // ?need=<term> seeds the search box; design-pass links here with the need it is trying to meet
  const params = new URLSearchParams(location.search)
  const need = params.get('need') ?? ''
  const [q, setQ] = useState(need || saved.q || '')
  const [source, setSource] = useState(saved.source ?? '')
  const [family, setFamily] = useState(saved.family ?? '')
  const [statuses, setStatuses] = useState<Set<Status>>(new Set(saved.statuses ?? DEFAULT_STATUSES))
  const [surfaces, setSurfaces] = useState<Set<string>>(new Set(saved.surfaces ?? SURFACES))
  const [weights, setWeights] = useState<Set<Weight>>(new Set(saved.weights ?? WEIGHTS))
  const [fetches, setFetches] = useState<Set<string>>(new Set(saved.fetches ?? FETCHES))
  const [sort, setSort] = useState<Sort>(saved.sort ?? 'name')
  const [minScore, setMinScore] = useState(saved.minScore ?? 0)
  // ?stage=light|dark forces the preview background (the screenshot script uses it)
  const forced = params.get('stage')
  const [stage, setStage] = useState<StageMode>(forced === 'light' || forced === 'dark' ? forced : (saved.stage ?? 'auto'))
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const s: Saved = { q: need ? '' : q, source, family, statuses: [...statuses], surfaces: [...surfaces], weights: [...weights], fetches: [...fetches], sort, minScore, stage }
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(s))
    } catch {
      /* private mode: filters just are not saved */
    }
  }, [q, need, source, family, statuses, surfaces, weights, fetches, sort, minScore, stage])
  const resetFilters = () => {
    setQ('')
    setSource('')
    setFamily('')
    setStatuses(new Set(DEFAULT_STATUSES))
    setSurfaces(new Set(SURFACES))
    setWeights(new Set(WEIGHTS))
    setFetches(new Set(FETCHES))
    setSort('name')
    setMinScore(0)
  }

  // #/item/<source>/<key> opens the detail page, #/queue/<source>/<key> the same page inside the review queue.
  // The grid stays mounted (hidden) so filters and scroll survive.
  const [hash, setHash] = useState(location.hash)
  const scrollY = useRef(0)
  const wasOpen = useRef(false)
  useEffect(() => {
    const on = () => {
      if (/^#\/(item|queue)\//.test(location.hash) && !wasOpen.current) scrollY.current = window.scrollY
      setHash(location.hash)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  const inQueue = hash.startsWith('#/queue/')
  const detailId = inQueue ? decodeURIComponent(hash.slice(8)) : hash.startsWith('#/item/') ? decodeURIComponent(hash.slice(7)) : ''

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    Promise.all([fetch('/api/items').then((r) => r.json()), fetch('/api/picks').then((r) => r.json()), fetch('/api/ranking').then((r) => r.json())])
      .then(([i, p, r]) => {
        setItems(i)
        setPicks(p.picks ?? {})
        setRanking(Object.fromEntries((r as { id: string }[]).map((e) => [e.id, e])) as Ranking)
      })
      .catch((e) => setLoadError(String(e)))
  }, [])

  const onPick = useCallback((id: string, patch: { status?: PickStatus | null; note?: string }) => {
    fetch('/api/picks', { method: 'POST', body: JSON.stringify({ id, ...patch }) })
      .then((r) => r.json())
      .then((p) => p.picks && setPicks(p.picks))
  }, [])

  const statusOf = useCallback((i: Item): Status => picks[i.id]?.status ?? i.status, [picks])
  const rows = useMemo(() => items.map((item) => ({ item, weight: weightOf(item) })), [items])

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const sorter = (a: { item: Item }, b: { item: Item }) => {
    if (sort === 'status') return STATUS_ORDER[statusOf(a.item)] - STATUS_ORDER[statusOf(b.item)] || a.item.title.localeCompare(b.item.title)
    if (sort === 'score') return (ranking[b.item.id]?.score ?? -1) - (ranking[a.item.id]?.score ?? -1) || a.item.title.localeCompare(b.item.title)
    return a.item.title.localeCompare(b.item.title) || a.item.id.localeCompare(b.item.id)
  }
  // search + sidebar only: the review queue applies its own status rule on top of these
  const searched = useMemo(
    () =>
      rows.filter(({ item }) => {
        const text = `${item.title} ${item.key} ${item.description} ${item.family} ${item.source} ${item.note ?? ''} ${picks[item.id]?.note ?? ''}`.toLowerCase()
        return (!source || item.source === source) && (!family || item.family === family) && words.every((w) => text.includes(w))
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, source, family, q, picks],
  )
  const visible = useMemo(
    () =>
      searched
        .filter(
          ({ item, weight }) =>
            statuses.has(statusOf(item)) &&
            surfaces.has(item.surface ?? 'untagged') &&
            weights.has(weight) &&
            fetches.has(fetchState(item)) &&
            (ranking[item.id]?.score ?? (minScore > 0 ? -1 : 0)) >= minScore,
        )
        .sort(sorter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searched, statuses, surfaces, weights, fetches, minScore, sort, ranking, statusOf],
  )

  // review queue: a snapshot taken when it opens, so items don't vanish from under the cursor as they are decided
  const [queueIds, setQueueIds] = useState<string[] | null>(null)
  const buildQueue = () => searched.filter(({ item }) => ['unreviewed', 'candidate'].includes(statusOf(item))).sort(sorter).map(({ item }) => item.id)
  useEffect(() => {
    if (inQueue && !queueIds && items.length) setQueueIds(buildQueue())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inQueue, queueIds, items.length])
  const openQueue = () => {
    const ids = buildQueue()
    setQueueIds(ids)
    if (ids[0]) location.hash = `#/queue/${ids[0]}`
  }
  const queueRows = useMemo(() => (queueIds ?? []).map((id) => rows.find((r) => r.item.id === id)).filter((r): r is NonNullable<typeof r> => !!r), [queueIds, rows])
  const undecided = queueRows.filter(({ item }) => ['unreviewed', 'candidate'].includes(statusOf(item)) && !picks[item.id]?.status).length

  const navRows = inQueue ? queueRows : visible
  const detailIdx = navRows.findIndex(({ item }) => item.id === detailId)
  const detailRow = rows.find(({ item }) => item.id === detailId)
  useEffect(() => {
    if (detailId && !wasOpen.current) scrollTo(0, 0)
    else if (!detailId && wasOpen.current) scrollTo(0, scrollY.current)
    wasOpen.current = !!detailId
  }, [detailId])
  const back = useCallback(() => {
    history.replaceState(null, '', location.pathname + location.search)
    setHash('')
    setQueueIds(null)
  }, [])
  const go = (item: Item) => {
    const h = (inQueue ? '#/queue/' : '#/item/') + item.id
    history.replaceState(null, '', location.pathname + location.search + h)
    setHash(h)
  }
  const step = (d: -1 | 1) => {
    if (navRows.length < 2) return
    go(navRows[(Math.max(detailIdx, 0) + d + navRows.length) % navRows.length].item)
  }
  const afterPick = () => {
    // queue: move on after a decision (stay on the last item)
    if (inQueue && detailIdx >= 0 && detailIdx < navRows.length - 1) go(navRows[detailIdx + 1].item)
  }

  const sources = [...new Set(items.map((i) => i.source))]
  const families = [...new Set(items.filter((i) => !source || i.source === source).map((i) => i.family))].sort()
  const count = (f: (i: Item) => boolean) => items.filter(f).length
  const notFetched = items.filter((i) => fetchState(i) === 'not fetched').length
  const failed = items.filter((i) => fetchState(i) === 'failed').length
  const ranked = Object.keys(ranking).length

  const exportPicks = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ picks }, null, 2)], { type: 'application/json' }))
    a.download = 'picks.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      {detailRow && (
        <Detail
          item={detailRow.item}
          weight={detailRow.weight}
          status={statusOf(detailRow.item)}
          pick={picks[detailRow.item.id]}
          rank={ranking[detailRow.item.id]}
          onPick={onPick}
          stage={stage}
          index={Math.max(detailIdx, 0)}
          total={navRows.length || 1}
          queue={inQueue ? { left: undecided } : undefined}
          onDone={afterPick}
          onBack={back}
          onStep={step}
        />
      )}
      <div className={cn('flex min-h-screen flex-col', detailId && 'hidden')}>
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-semibold">UI gallery</h1>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, key, description, notes" aria-label="Search" className="max-w-sm" />
          {need && <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">need: {need}</span>}
          <span className="text-sm text-muted-foreground">
            {visible.length} of {items.length} shown
            {notFetched ? `, ${notFetched} not fetched` : ''}
            {failed ? `, ${failed} fetch failed` : ''}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" onClick={openQueue} disabled={!items.length} title="Step through unreviewed + candidate items, one at a time. A adopt, C candidate, R reject, D delete (needs a note), arrows move.">
              Review queue ({searched.filter(({ item }) => ['unreviewed', 'candidate'].includes(statusOf(item))).length})
            </Button>
            <Button variant="outline" size="sm" onClick={exportPicks}>
              Export picks ({Object.keys(picks).length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStage((s) => (s === 'auto' ? 'light' : s === 'light' ? 'dark' : 'auto'))} title="Background behind every preview: auto (dark for backgrounds), light, dark">
              Previews: {stage}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDark((d) => !d)} aria-pressed={dark}>
              {dark ? 'Light' : 'Dark'}
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 overflow-y-auto border-r p-3 text-sm md:block">
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Source</p>
            <SideButton on={!source} onClick={() => (setSource(''), setFamily(''))}>
              All <em>{items.length}</em>
            </SideButton>
            {sources.map((s) => (
              <SideButton key={s} on={source === s} onClick={() => (setSource(s), setFamily(''))}>
                {s} <em>{count((i) => i.source === s)}</em>
              </SideButton>
            ))}
            <p className="mb-1 mt-4 text-xs font-medium uppercase text-muted-foreground">Family</p>
            <SideButton on={!family} onClick={() => setFamily('')}>
              All
            </SideButton>
            {families.map((f) => (
              <SideButton key={f} on={family === f} onClick={() => setFamily(f)}>
                {f} <em>{count((i) => i.family === f && (!source || i.source === source))}</em>
              </SideButton>
            ))}
          </aside>

          <main className="min-w-0 flex-1 p-4">
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-16 text-xs text-muted-foreground">Status</span>
                {STATUSES.map((s) => (
                  <Chip key={s} on={statuses.has(s)} onClick={() => setStatuses(toggle(statuses, s))} className={cn('border-transparent', STATUS_STYLE[s])}>
                    {s} {count((i) => statusOf(i) === s && (!source || i.source === source) && (!family || i.family === family))}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-16 text-xs text-muted-foreground">Surface</span>
                {SURFACES.map((s) => (
                  <Chip key={s} on={surfaces.has(s)} onClick={() => setSurfaces(toggle(surfaces, s))}>
                    {s}
                  </Chip>
                ))}
                <span className="ml-4 w-10 text-xs text-muted-foreground">Deps</span>
                {WEIGHTS.map((w) => (
                  <Chip key={w} on={weights.has(w)} onClick={() => setWeights(toggle(weights, w))}>
                    {w}
                  </Chip>
                ))}
                <span className="ml-4 w-10 text-xs text-muted-foreground">Fetch</span>
                {FETCHES.map((f) => (
                  <Chip key={f} on={fetches.has(f)} onClick={() => setFetches(toggle(fetches, f))}>
                    {f} {count((i) => fetchState(i) === f)}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5">
                  Sort
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded border bg-background px-1.5 py-1 text-foreground" aria-label="Sort">
                    <option value="name">name</option>
                    <option value="status">status</option>
                    <option value="score">ranking (best first)</option>
                  </select>
                </label>
                <label className="flex items-center gap-1.5" title={ranked ? '' : 'No ranking yet: run /gallery-rank'}>
                  Min score
                  <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="rounded border bg-background px-1.5 py-1 text-foreground" aria-label="Minimum score">
                    {[0, 2, 3, 3.5, 4, 4.5].map((n) => (
                      <option key={n} value={n}>
                        {n ? `≥ ${n}` : 'any'}
                      </option>
                    ))}
                  </select>
                  <span>{ranked} ranked</span>
                </label>
                <button type="button" className="underline hover:text-foreground" onClick={resetFilters}>
                  Reset filters
                </button>
                <span>Filters are saved in this browser.</span>
              </div>
            </div>
            {loadError && <p className="text-destructive">{loadError}</p>}
            <Grid
              items={visible}
              hidden={!!detailId}
              getKey={({ item }) => item.id}
              render={({ item, weight }) => <Card item={item} weight={weight} status={statusOf(item)} pick={picks[item.id]} rank={ranking[item.id]} onPick={onPick} stage={stage} />}
            />
            {!visible.length && !loadError && <p className="py-16 text-center text-muted-foreground">Nothing matches these filters.</p>}
          </main>
        </div>
      </div>
    </>
  )
}

