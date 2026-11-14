import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { assigned, type Categories, type CatGroup, type Picks } from './types'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'value'

// Manager for the category lists: add, rename, reorder, remove. Ids stay fixed on rename, so assignments survive it.
// Removing a value that items still use asks first; those items keep the id and show it flagged as removed.
export function CategoryManager({ cats, picks, onSave, onBack }: { cats: Categories; picks: Picks; onSave: (c: Categories) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const useCount = (g: CatGroup, id: string) => Object.values(picks).filter((p) => assigned(p, g.id).includes(id)).length
  const edit = (g: CatGroup, values: CatGroup['values']) => onSave({ groups: cats.groups.map((x) => (x.id === g.id ? { ...x, values } : x)) })
  const move = (g: CatGroup, i: number, d: -1 | 1) => {
    const v = [...g.values]
    ;[v[i], v[i + d]] = [v[i + d], v[i]]
    edit(g, v)
  }
  const add = (g: CatGroup) => {
    const label = (draft[g.id] ?? '').trim()
    if (!label) return
    let id = slug(label)
    while (g.values.some((v) => v.id === id)) id += '-2'
    edit(g, [...g.values, { id, label }])
    setDraft({ ...draft, [g.id]: '' })
  }
  const remove = (g: CatGroup, i: number) => {
    const v = g.values[i]
    const n = useCount(g, v.id)
    if (n && !confirm(`${n} item(s) use "${v.label}". Remove it anyway? They keep the assignment, shown as "removed" until you unassign it.`)) return
    edit(g, g.values.filter((_, j) => j !== i))
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-4" data-categories>
      <header className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back to grid
        </Button>
        <h1 className="text-lg font-semibold">Categories</h1>
        <span className="text-xs text-muted-foreground">Saved to categories.json as you edit.</span>
      </header>
      {cats.groups.map((g) => (
        <section key={g.id} className="rounded-lg border p-3">
          <h2 className="font-medium">
            {g.label} <span className="text-xs font-normal text-muted-foreground">{g.multi ? 'an item can have several' : 'one per item'}</span>
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {g.values.map((v, i) => (
              <li key={v.id} className="flex items-center gap-2">
                <Input defaultValue={v.label} aria-label={`Rename ${v.label}`} className="h-8 max-w-xs" onBlur={(e) => e.target.value.trim() && e.target.value !== v.label && edit(g, g.values.map((x) => (x.id === v.id ? { ...x, label: e.target.value.trim() } : x)))} />
                <span className="w-16 text-xs tabular-nums text-muted-foreground">{useCount(g, v.id)} items</span>
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(g, i, -1)} aria-label={`Move ${v.label} up`}>
                  ↑
                </Button>
                <Button size="sm" variant="ghost" disabled={i === g.values.length - 1} onClick={() => move(g, i, 1)} aria-label={`Move ${v.label} down`}>
                  ↓
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(g, i)} aria-label={`Remove ${v.label}`}>
                  Remove
                </Button>
                {v.rule && <span className="hidden text-xs text-muted-foreground md:inline">{v.rule}</span>}
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              add(g)
            }}
          >
            <Input value={draft[g.id] ?? ''} onChange={(e) => setDraft({ ...draft, [g.id]: e.target.value })} placeholder={`New ${g.label.toLowerCase()} value`} aria-label={`New ${g.label} value`} className="h-8 max-w-xs" />
            <Button size="sm" type="submit">
              Add
            </Button>
          </form>
        </section>
      ))}
    </div>
  )
}
