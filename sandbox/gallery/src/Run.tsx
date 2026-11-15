import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Preview, type Stage } from './Preview'
import type { Item } from './types'

// design-pass "Choose components": #/select/<run-id> picks per need before the build, #/review/<run-id> compares
// what was used with the alternatives afterwards. Files and fields: runs-api.mjs and
// plugins/design-stack/skills/design-pass/scripts/shortlist.mjs.
interface Need {
  id: string
  label: string
  scope: 'shared' | 'page'
  page?: string
  fixed?: string // chosen earlier in this project's kit: not asked again
  default?: string | null
  alternatives?: string[]
  withPackages?: string[]
}
interface RunFile {
  id: string
  mode: 'safe' | 'free'
  needs: Need[]
  extras: { id: string; kind: string }[]
  packages: Record<string, string[]>
}
interface Loaded {
  run: RunFile
  selection: { choices: Record<string, string>; extras: string[] } | null
  result: { choices: Record<string, string | null> } | null
  swaps: { swaps: Record<string, string> } | null
}

const NONE = 'none'
const post = (url: string, body: unknown) => fetch(url, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json())

function useRun(id: string) {
  const [data, setData] = useState<Loaded>()
  const [items, setItems] = useState<Map<string, Item>>()
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([fetch(`/api/runs/${id}`).then((r) => r.json()), fetch('/api/items').then((r) => r.json())])
      .then(([d, list]: [Loaded & { error?: string }, Item[]]) => {
        if (d.error) return setError(d.error)
        setData(d)
        setItems(new Map(list.map((i) => [i.id, i])))
      })
      .catch((e) => setError(String(e)))
  }, [id])
  return { data, items, error }
}

function Tile({ item, label, on, onClick, packages, note, stage }: { item?: Item; label?: string; on: boolean; onClick: () => void; packages?: string[]; note?: string; stage: Stage }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn('flex w-60 shrink-0 flex-col gap-1.5 rounded-lg border p-2 text-left motion-safe:transition-colors', on ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted')}
    >
      {item ? <Preview item={item} stage={stage} className="h-36" /> : <div className="grid h-36 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">No catalog component</div>}
      <span className="truncate text-sm font-medium">{item?.title ?? label ?? 'None / plain shadcn'}</span>
      <span className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        {item && <span>{item.key}</span>}
        {note && <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{note}</span>}
        {packages?.length ? <span className="rounded-full bg-warning px-2 py-0.5 text-warning-foreground">adds {packages.join(', ')}</span> : null}
      </span>
    </button>
  )
}

function Header({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <h1 className="text-lg font-semibold">{title}</h1>
      <span className="text-sm text-muted-foreground">{sub}</span>
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </header>
  )
}

const StageToggle = ({ stage, set }: { stage: Stage; set: (s: Stage) => void }) => (
  <Button variant="outline" size="sm" onClick={() => set(stage === 'light' ? 'dark' : 'light')}>
    Previews: {stage}
  </Button>
)

const Wait = ({ id, error }: { id: string; error: string }) => (error ? <p className="p-6 text-sm text-destructive">{error}</p> : <p className="p-6 text-sm text-muted-foreground">Loading run {id}…</p>)

export function Select({ id }: { id: string }) {
  const { data, items, error } = useRun(id)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [extras, setExtras] = useState<Set<string>>(new Set())
  const [showPkg, setShowPkg] = useState(false)
  const [stage, setStage] = useState<Stage>('light')
  const [saved, setSaved] = useState('')
  useEffect(() => {
    if (!data) return
    const prior = data.selection?.choices
    setChoices(Object.fromEntries(data.run.needs.filter((n) => !n.fixed).map((n) => [n.id, prior?.[n.id] ?? n.default ?? NONE])))
    setExtras(new Set(data.selection?.extras ?? []))
  }, [data])

  const pkgs = useMemo(() => {
    if (!data) return []
    const picked = [...Object.values(choices), ...extras].filter((c) => c !== NONE)
    return [...new Set(picked.flatMap((i) => data.run.packages[i] ?? []))]
  }, [data, choices, extras])

  if (!data || !items) return <Wait id={id} error={error} />
  const { run } = data
  const done = () =>
    post(`/api/runs/${id}/selection`, { done: true, choices, extras: [...extras], packages: pkgs }).then((s) =>
      setSaved(s.error ?? `Saved ${Object.keys(choices).length} choices${pkgs.length ? ` and ${pkgs.length} package(s)` : ''}. Tell Claude "done".`),
    )
  const pages = [...new Set(run.needs.filter((n) => n.scope === 'page').map((n) => n.page ?? 'Page'))]
  const groups = [
    { title: 'App kit (shared, chosen once)', needs: run.needs.filter((n) => n.scope === 'shared') },
    ...pages.map((p) => ({ title: p, needs: run.needs.filter((n) => n.scope === 'page' && (n.page ?? 'Page') === p) })),
  ].filter((g) => g.needs.length)
  const hiddenCount = run.needs.reduce((s, n) => s + (n.withPackages?.length ?? 0), 0)
  const toggleExtra = (i: string) =>
    setExtras((s) => {
      const n = new Set(s)
      if (!n.delete(i)) n.add(i)
      return n
    })

  return (
    <div className="min-h-screen" data-view="select">
      <Header title="Choose components" sub={`${run.id} · ${run.mode === 'safe' ? 'Safe mode' : 'Free mode'}`}>
        {run.mode === 'safe' && hiddenCount > 0 && (
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={showPkg} onChange={(e) => setShowPkg(e.target.checked)} />
            Show items that add a package ({hiddenCount})
          </label>
        )}
        <StageToggle stage={stage} set={setStage} />
        <Button onClick={done}>Done</Button>
      </Header>
      {saved && (
        <p role="status" className="border-b bg-accent px-4 py-2 text-sm text-accent-foreground">
          {saved}
        </p>
      )}
      {pkgs.length > 0 && <p className="border-b bg-warning px-4 py-2 text-sm text-warning-foreground">Your picks add: {pkgs.join(', ')}. Choosing them counts as your yes to install.</p>}
      <main className="space-y-8 p-4">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-base font-semibold">{g.title}</h2>
            <div className="space-y-5">
              {g.needs.map((n) => (
                <div key={n.id} data-need={n.id}>
                  <h3 className="mb-2 text-sm font-medium">{n.label}</h3>
                  {n.fixed ? (
                    <p className="text-sm text-muted-foreground">From your kit: {items.get(n.fixed)?.title ?? n.fixed}</p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {[n.default, ...(n.alternatives ?? []), ...(showPkg ? (n.withPackages ?? []) : [])]
                        .filter((x): x is string => !!x)
                        .map((i) => (
                          <Tile key={i} item={items.get(i)} label={i} stage={stage} on={choices[n.id] === i} onClick={() => setChoices({ ...choices, [n.id]: i })} packages={run.packages[i]} note={i === n.default ? 'suggested' : undefined} />
                        ))}
                      <Tile stage={stage} on={choices[n.id] === NONE} onClick={() => setChoices({ ...choices, [n.id]: NONE })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        {run.extras.length > 0 && (
          <section data-need="extras">
            <h2 className="mb-1 text-base font-semibold">Extras (optional)</h2>
            <p className="mb-3 text-sm text-muted-foreground">Backgrounds, text effects, dividers, loaders. Nothing is used unless you tick it.</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {run.extras.map((e) => (
                <Tile key={e.id} item={items.get(e.id)} label={e.id} stage={stage} on={extras.has(e.id)} note={e.kind} packages={run.packages[e.id]} onClick={() => toggleExtra(e.id)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export function Review({ id }: { id: string }) {
  const { data, items, error } = useRun(id)
  const [swaps, setSwaps] = useState<Record<string, string>>({})
  const [stage, setStage] = useState<Stage>('light')
  const [saved, setSaved] = useState('')
  useEffect(() => {
    if (data?.swaps) setSwaps(data.swaps.swaps ?? {})
  }, [data])
  if (!data || !items) return <Wait id={id} error={error} />
  if (!data.result) return <p className="p-6 text-sm text-muted-foreground">Run {id} has no result yet. design-pass writes it after the build.</p>
  const used = data.result.choices
  const needs = data.run.needs.filter((n) => used[n.id])
  const save = () => post(`/api/runs/${id}/swaps`, { swaps }).then((s) => setSaved(s.error ?? `Saved ${Object.keys(swaps).length} swap(s). Tell Claude to apply them.`))
  return (
    <div className="min-h-screen" data-view="review">
      <Header title="Review components" sub={data.run.id}>
        <StageToggle stage={stage} set={setStage} />
        <Button onClick={save}>Save swaps</Button>
      </Header>
      {saved && (
        <p role="status" className="border-b bg-accent px-4 py-2 text-sm text-accent-foreground">
          {saved}
        </p>
      )}
      <main className="space-y-6 p-4">
        {needs.length === 0 && <p className="text-sm text-muted-foreground">No catalog components were used in this run.</p>}
        {needs.map((n) => (
          <section key={n.id} data-need={n.id}>
            <h2 className="mb-2 text-sm font-medium">{n.label}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <Tile
                item={items.get(used[n.id]!)}
                label={used[n.id]!}
                stage={stage}
                on={!swaps[n.id]}
                note="used"
                onClick={() => {
                  const s = { ...swaps }
                  delete s[n.id]
                  setSwaps(s)
                }}
              />
              {[n.default, ...(n.alternatives ?? [])]
                .filter((x): x is string => !!x && x !== used[n.id])
                .map((i) => (
                  <Tile key={i} item={items.get(i)} label={i} stage={stage} on={swaps[n.id] === i} note="swap to this" packages={data.run.packages[i]} onClick={() => setSwaps({ ...swaps, [n.id]: i })} />
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
