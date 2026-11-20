import { Component, createElement, lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import demoProps from '../demo-props.json'
import type { Item } from './types'

export type Stage = 'light' | 'dark'
export type StageMode = Stage | 'auto'
// WebGL and glow backgrounds are additive light: invisible on white. In auto mode they get the dark stage.
export const stageFor = (item: { family: string }, mode: StageMode): Stage => (mode === 'auto' ? (item.family === 'backgrounds' ? 'dark' : 'light') : mode)
export type PreviewState = 'idle' | 'loading' | 'rendered' | 'blank' | 'error'

// Downloaded sources live in the gitignored src/items/. The glob is empty until `npm run gallery:fetch` has run.
const loaders = import.meta.glob('./items/*/*/**/*.{tsx,jsx}') as Record<string, () => Promise<Record<string, unknown>>>

// Props (and string children) a component needs to show anything; see README.
const demo = demoProps as unknown as Record<string, Record<string, unknown> & { _children?: string | string[]; _text?: string }>

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

// slot 'original' is the downloaded source; anything else is a working copy of a variant under src/work/ (see variants.mjs).
// Those are imported by URL: Vite serves them with HMR, and files that appear later need no glob refresh.
function loadComponent(item: Item, slot: string) {
  const load =
    slot === 'original'
      ? loaders[`./items/${item.source}/${item.key}/${item.fetch.entry}`]
      : () => import(/* @vite-ignore */ `/src/work/${item.source}/${item.key}/${slot}/files/${item.fetch.entry}`) as Promise<Record<string, unknown>>
  if (!load) throw new Error('source not on disk: run npm run gallery:fetch')
  return lazy(async () => {
    const mod = await load()
    // memo() and forwardRef() components are objects, not functions
    const isComp = (v: unknown) => typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in v)
    const C = isComp(mod.default) ? mod.default : Object.entries(mod).find(([k, v]) => /^[A-Z]/.test(k) && isComp(v))?.[1]
    if (!C) throw new Error('no component export found')
    return { default: C as ComponentType<Record<string, unknown>> }
  })
}

function Mount({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount])
  return null
}

function Live({ item, slot, onError, onLoaded }: { item: Item; slot: string; onError: (m: string) => void; onLoaded: () => void }) {
  const [C, err] = useMemo(() => {
    try {
      return [loadComponent(item, slot), undefined] as const
    } catch (e) {
      return [undefined, (e as Error).message] as const
    }
  }, [item, slot])
  useEffect(() => {
    if (err) onError(err)
  }, [err, onError])
  if (!C) return null
  const { _children, _text, ...props } = demo[item.id] ?? {}
  const kids = _text !== undefined ? [_text] : _children === undefined ? undefined : [_children].flat().map((t, i) => createElement('div', { key: i, className: 'p-4' }, t))
  return (
    <Boundary onError={onError}>
      <Suspense fallback={null}>
        {createElement(C, props, ...(kids ?? []))}
        <Mount onMount={onLoaded} />
      </Suspense>
    </Boundary>
  )
}

// Is there anything visible in the stage? Text, media, a sized painted box, or a canvas with non-black pixels.
const scratch = document.createElement('canvas')
function hasContent(root: HTMLElement) {
  if (root.innerText.trim()) return true
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) continue
    const tag = el.tagName
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'svg' || tag === 'PICTURE') return true
    if (tag === 'CANVAS') {
      try {
        // a WebGL canvas returns null for a 2d context; its pixels can't be sampled reliably between frames, so a sized one counts
        if ((el as HTMLCanvasElement).getContext('2d') === null) return true
        scratch.width = scratch.height = 24
        const ctx = scratch.getContext('2d', { willReadFrequently: true })!
        ctx.clearRect(0, 0, 24, 24)
        ctx.drawImage(el as HTMLCanvasElement, 0, 0, 24, 24)
        const d = ctx.getImageData(0, 0, 24, 24).data
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8 && (d[i] > 12 || d[i + 1] > 12 || d[i + 2] > 12)) return true
      } catch {
        return true // tainted or unreadable canvas: assume it shows something
      }
      continue
    }
    const cs = getComputedStyle(el)
    if (cs.backgroundImage !== 'none') return true
    const bg = cs.backgroundColor
    if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') return true
  }
  return false
}

const LABEL: Record<PreviewState, string> = { idle: '', loading: 'loading…', rendered: '', blank: 'renders blank', error: "won't render" }

// Mounts the preview only while the card is near the viewport: dozens of WebGL canvases at once would exhaust contexts.
export function Preview({
  item,
  stage,
  onState,
  className = 'h-56',
  width,
  eager,
  slot = 'original',
}: {
  item: Item
  stage: Stage
  onState?: (s: PreviewState) => void
  className?: string
  width?: number | string
  eager?: boolean // detail page: always mounted, no viewport gating
  slot?: string // 'original', '_draft' or a variant name
}) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [nearView, setNear] = useState(false)
  const near = eager || nearView
  const [error, setError] = useState(item.fetch.error)
  const [loaded, setLoaded] = useState(false)
  const [blank, setBlank] = useState(false)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '200px' })
    if (box.current) io.observe(box.current)
    // the observer is throttled in background tabs and under load; a cheap rect poll keeps previews from sticking on idle
    const poll = setInterval(() => {
      const r = box.current?.getBoundingClientRect()
      if (r) setNear(r.width > 0 && r.bottom > -200 && r.top < innerHeight + 200) // width 0: grid hidden behind the detail page
    }, 1000)
    return () => (io.disconnect(), clearInterval(poll))
  }, [])

  useEffect(() => {
    if (!near) {
      setLoaded(false)
      setBlank(false)
      setSlow(false)
    }
  }, [near])

  // not loaded after 15 s: say so, offer a retry
  useEffect(() => {
    if (!near || loaded || error) return
    const t = setTimeout(() => setSlow(true), 15000)
    return () => clearTimeout(t)
  }, [near, loaded, error, attempt])

  // once loaded, look for visible content every 1.5 s for ~12 s (shaders and animations may start late); stop at the first hit
  useEffect(() => {
    if (!loaded || error) return
    let n = 0
    const t = setInterval(() => {
      n++
      if (inner.current && hasContent(inner.current)) {
        setBlank(false)
        clearInterval(t)
      } else if (n >= 2) setBlank(true)
      if (n >= 8) clearInterval(t)
    }, 1500)
    return () => clearInterval(t)
  }, [loaded, error, attempt, stage])

  const state: PreviewState = error ? 'error' : !near ? 'idle' : !loaded ? 'loading' : blank ? 'blank' : 'rendered'
  useEffect(() => onState?.(state), [state, onState])

  return (
    <div
      ref={box}
      data-state={state}
      style={{ ...(width ? { width, maxWidth: '100%' } : null) }}
      className={`relative isolate mx-auto w-full overflow-hidden rounded-md border [contain:layout_paint] ${className} ${
        stage === 'dark' ? 'dark polished bg-neutral-900 text-neutral-100' : 'stage-light polished bg-white text-neutral-900'
      }`}
    >
      {error ? (
        <div className="max-h-full w-full overflow-auto p-3 text-xs">
          <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-medium text-destructive">{error.startsWith('not fetched') ? 'not fetched' : "won't render"}</span>
          <p className="mt-2 break-words font-mono text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div ref={inner} className="relative flex h-full w-full items-center justify-center">
          {near && <Live key={attempt} item={item} slot={slot} onError={setError} onLoaded={() => setLoaded(true)} />}
        </div>
      )}
      {!error && LABEL[state] && (
        <span
          className={`absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-xs ${
            state === 'blank' ? 'bg-warning text-warning-foreground' : 'bg-black/50 text-white'
          }`}
        >
          {state === 'loading' && slow ? 'still loading…' : LABEL[state]}
          {state === 'loading' && slow && (
            <button type="button" className="ml-1.5 underline" onClick={() => (setSlow(false), setAttempt((a) => a + 1))}>
              retry
            </button>
          )}
        </span>
      )}
    </div>
  )
}
