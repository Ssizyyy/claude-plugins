import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { Item } from './types'

// Downloaded sources live in the gitignored src/items/. The glob is empty until `npm run gallery:fetch` has run.
const loaders = import.meta.glob('./items/*/*/*.{tsx,jsx}') as Record<string, () => Promise<Record<string, unknown>>>

class Boundary extends Component<{ children: ReactNode; onError: (m: string) => void }, { error?: string }> {
  state: { error?: string } = {}
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
  componentDidCatch(e: unknown) {
    this.props.onError(e instanceof Error ? e.message : String(e))
  }
  render() {
    return this.state.error ? null : this.props.children
  }
}

function loadComponent(item: Item) {
  const load = loaders[`./items/${item.source}/${item.key}/${item.fetch.entry}`]
  if (!load) throw new Error('source not on disk: run npm run gallery:fetch')
  return lazy(async () => {
    const mod = await load()
    // memo() and forwardRef() components are objects, not functions
    const isComp = (v: unknown) => typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v)
    const C = isComp(mod.default) ? mod.default : Object.entries(mod).find(([k, v]) => /^[A-Z]/.test(k) && isComp(v))?.[1]
    if (!C) throw new Error('no component export found')
    return { default: C as ComponentType }
  })
}

function Live({ item, onError }: { item: Item; onError: (m: string) => void }) {
  const [C, err] = useMemo(() => {
    try {
      return [loadComponent(item), undefined] as const
    } catch (e) {
      return [undefined, (e as Error).message] as const
    }
  }, [item])
  useEffect(() => {
    if (err) onError(err)
  }, [err, onError])
  if (!C) return null
  return (
    <Boundary onError={onError}>
      <Suspense fallback={<span className="text-xs text-muted-foreground">loading…</span>}>
        <C />
      </Suspense>
    </Boundary>
  )
}

// Mounts the preview only while the card is near the viewport: dozens of WebGL canvases at once would exhaust contexts.
export function Preview({ item }: { item: Item }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [error, setError] = useState(item.fetch.error)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '200px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className="relative isolate flex h-56 items-center justify-center overflow-hidden rounded-md border bg-background [contain:layout_paint]"
    >
      {error ? (
        <div className="max-h-full w-full overflow-auto p-3 text-xs">
          <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-medium text-destructive">won't render</span>
          <p className="mt-2 break-words font-mono text-muted-foreground">{error}</p>
        </div>
      ) : near ? (
        <Live item={item} onError={setError} />
      ) : null}
    </div>
  )
}
