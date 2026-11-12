import { useLayoutEffect, useRef, useState } from "react"
import { Badge } from "@/polished/ui/badge"
import { Button } from "@/polished/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/polished/ui/card"
import { Input } from "@/polished/ui/input"

const pairs = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  ["primary", "background"],
  ["destructive", "background"],
] as const

const roles = ["background", "card", "primary", "secondary", "muted", "accent", "success", "warning", "info", "destructive", "border", "ring"]
const scale = [
  ["text-xs", "12 · captions, table meta"],
  ["text-sm", "14 · body, controls"],
  ["text-base", "16 · lead text"],
  ["text-xl", "20 · card titles"],
  ["text-3xl", "28 · page titles"],
  ["text-5xl", "40 · display numbers"],
]

// Resolve any CSS colour (oklch included) to sRGB via a 1px canvas.
const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
function rgb(color: string): [number, number, number] {
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = "#000"
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const d = ctx.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2]]
}
const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

function Panel({ dark }: { dark?: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<{ name: string; ratio: number }[]>([])
  useLayoutEffect(() => {
    const s = getComputedStyle(el.current!)
    const v = (n: string) => s.getPropertyValue(`--${n}`).trim()
    setRows(pairs.map(([f, b]) => ({ name: `${f} on ${b}`, ratio: ratio(v(f), v(b)) })))
  }, [])

  return (
    <div ref={el} className={`polished ${dark ? "dark" : ""} space-y-6 rounded-xl border p-6`}>
      <h2 className="text-xl font-semibold">{dark ? "Dark" : "Light"}</h2>
      <div className="grid grid-cols-4 gap-2">
        {roles.map((r) => (
          <div key={r} className="space-y-1">
            <div className="h-10 rounded-md border" style={{ background: `var(--${r})` }} />
            <div className="text-xs text-muted-foreground">{r}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-xs">
        {rows.map((r) => (
          <div key={r.name} className="flex justify-between">
            <span>{r.name}</span>
            <span className="tnum">
              {r.ratio.toFixed(2)} {r.ratio >= 4.5 ? "AA" : r.ratio >= 3 ? "large only" : "FAIL"}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {scale.map(([c, label]) => (
          <div key={c} className={`${c} leading-tight`}>
            Sandbox <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="tnum text-3xl font-semibold">$48,210.00</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
        <Input placeholder="Input" className="max-w-40" />
        <Badge>Paid</Badge>
      </div>
      <Card className="shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle>Card</CardTitle>
          <CardDescription>Surface, border and text roles together.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">Radius 8 px, shadow-sm.</CardContent>
      </Card>
    </div>
  )
}

export default function Swatch() {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <Panel />
      <Panel dark />
    </div>
  )
}
