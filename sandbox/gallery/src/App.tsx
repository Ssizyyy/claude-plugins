import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Card, STATUS_STYLE } from './Card'
import type { Item, Picks, PickStatus, Status, Weight } from './types'

const STATUSES: Status[] = ['used', 'adopted', 'candidate', 'unreviewed', 'rejected', 'deleted']
const SURFACES = ['app', 'marketing', 'both', 'untagged'] as const
const WEIGHTS: Weight[] = ['basic', 'extra', 'heavy']
const BASIC = new Set(['clsx', 'tailwind-merge', 'react', 'react-dom', 'lucide-react', 'class-variance-authority', 'radix-ui', 'cn'])
const HEAVY = ['gsap', 'ogl', 'three', 'matter-js', 'lenis', 'vgpu', '@react-three']

const depName = (d: string) => d.replace(/@[\^~]?[\d.]+$/, '')
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

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [picks, setPicks] = useState<Picks>({})
  const [loadError, setLoadError] = useState('')
  // ?need=<term> seeds the search box; design-pass links here with the need it is trying to meet
  const need = new URLSearchParams(location.search).get('need') ?? ''
  const [q, setQ] = useState(need)
  const [source, setSource] = useState('')
  const [family, setFamily] = useState('')
  const [statuses, setStatuses] = useState<Set<Status>>(new Set(STATUSES.filter((s) => s !== 'deleted')))
  const [surfaces, setSurfaces] = useState<Set<string>>(new Set(SURFACES))
  const [weights, setWeights] = useState<Set<Weight>>(new Set(WEIGHTS))
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    Promise.all([fetch('/api/items').then((r) => r.json()), fetch('/api/picks').then((r) => r.json())])
      .then(([i, p]) => {
        setItems(i)
        setPicks(p.picks ?? {})
      })
      .catch((e) => setLoadError(String(e)))
  }, [])

  const onPick = useCallback((id: string, patch: { status?: PickStatus | null; note?: string }) => {
    fetch('/api/picks', { method: 'POST', body: JSON.stringify({ id, ...patch }) })
      .then((r) => r.json())
      .then((p) => p.picks && setPicks(p.picks))
  }, [])

  const statusOf = (i: Item): Status => picks[i.id]?.status ?? i.status
  const rows = useMemo(() => items.map((item) => ({ item, weight: weightOf(item) })), [items])

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const visible = rows.filter(({ item, weight }) => {
    const text = `${item.title} ${item.key} ${item.description} ${item.family} ${item.source} ${item.note ?? ''} ${picks[item.id]?.note ?? ''}`.toLowerCase()
    return (
      (!source || item.source === source) &&
      (!family || item.family === family) &&
      statuses.has(statusOf(item)) &&
      surfaces.has(item.surface ?? 'untagged') &&
      weights.has(weight) &&
      words.every((w) => text.includes(w))
    )
  })

  const sources = [...new Set(items.map((i) => i.source))]
  const families = [...new Set(items.filter((i) => !source || i.source === source).map((i) => i.family))].sort()
  const count = (f: (i: Item) => boolean) => items.filter(f).length
  const failed = items.filter((i) => i.fetch.error).length

  const exportPicks = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ picks }, null, 2)], { type: 'application/json' }))
    a.download = 'picks.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">UI gallery</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, key, description, notes" aria-label="Search" className="max-w-sm" />
        {need && <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">need: {need}</span>}
        <span className="text-sm text-muted-foreground">
          {visible.length} of {items.length} shown{failed ? `, ${failed} not fetched` : ''}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPicks}>
            Export picks ({Object.keys(picks).length})
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
                  {s} {count((i) => statusOf(i) === s)}
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
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-xs text-muted-foreground">Deps</span>
              {WEIGHTS.map((w) => (
                <Chip key={w} on={weights.has(w)} onClick={() => setWeights(toggle(weights, w))}>
                  {w}
                </Chip>
              ))}
            </div>
          </div>
          {loadError && <p className="text-destructive">{loadError}</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {visible.map(({ item, weight }) => (
              <Card key={item.id} item={item} weight={weight} status={statusOf(item)} pick={picks[item.id]} onPick={onPick} />
            ))}
          </div>
          {!visible.length && !loadError && <p className="py-16 text-center text-muted-foreground">Nothing matches these filters.</p>}
        </main>
      </div>
    </div>
  )
}
