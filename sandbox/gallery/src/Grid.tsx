import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CARD_H } from './Card'

const MIN_W = 460
const GAP = 16

// Windowed grid: only the rows near the viewport are mounted (754 cards with live previews would never fit).
// Cards have a fixed height, so the row math needs no measuring. The page scrolls, not an inner box.
export function Grid<T>({ items, render, getKey, hidden }: { items: T[]; render: (item: T) => ReactNode; getKey: (item: T) => string; hidden?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(1)
  const [range, setRange] = useState<[number, number]>([0, 3])
  const rowH = CARD_H + GAP
  const rows = Math.ceil(items.length / cols)

  const measure = () => {
    const el = box.current
    if (!el || hidden || el.offsetWidth === 0) return
    const c = Math.max(1, Math.floor((el.offsetWidth + GAP) / (MIN_W + GAP)))
    setCols(c)
    const top = el.getBoundingClientRect().top + scrollY
    const first = Math.max(0, Math.floor((scrollY - top) / rowH) - 1)
    const last = Math.ceil((scrollY + innerHeight - top) / rowH) + 1
    setRange((r) => (r[0] === first && r[1] === last ? r : [first, last]))
  }
  useLayoutEffect(measure)
  useEffect(() => {
    addEventListener('scroll', measure, { passive: true })
    addEventListener('resize', measure)
    return () => (removeEventListener('scroll', measure), removeEventListener('resize', measure))
  })

  const start = Math.min(range[0], Math.max(0, rows - 1))
  const end = Math.min(range[1], rows)
  return (
    <div ref={box} style={{ paddingTop: start * rowH, paddingBottom: Math.max(0, rows - end) * rowH }}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.slice(start * cols, end * cols).map((it) => (
          <div key={getKey(it)}>{render(it)}</div>
        ))}
      </div>
    </div>
  )
}
