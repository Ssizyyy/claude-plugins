import { cn } from '@/lib/utils'
import { assigned, type CatGroup, type Categories, type CatPatch, type GroupId, type Pick, type Rank } from './types'

export const labelOf = (cats: Categories, g: GroupId, id: string) => cats.groups.find((x) => x.id === g)?.values.find((v) => v.id === id)?.label

const chip = 'rounded-full border px-2 py-0.5 text-xs'

// Assigned categories as small read-only chips. An id whose value was removed from categories.json is shown flagged.
export function CatChips({ pick, cats, className }: { pick?: Pick; cats: Categories; className?: string }) {
  const all = cats.groups.flatMap((g) => assigned(pick, g.id).map((id) => ({ g: g.id, id, label: labelOf(cats, g.id, id) })))
  if (!all.length) return <p className={cn('text-xs text-muted-foreground', className)}>No categories yet</p>
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {all.map(({ g, id, label }) => (
        <span key={g + id} className={cn(chip, g === 'tone' ? 'border-primary bg-primary/10' : 'bg-muted', !label && 'border-destructive text-destructive')} title={label ? g : 'This value was removed from the category list'}>
          {label ?? `⚠ ${id} (removed)`}
        </span>
      ))}
    </div>
  )
}

// Toggle chips for every value of every group. Used on the detail page (set / clear) and for bulk assign (add only).
export function CatPalette({ pick, cats, onChange, bulk }: { pick?: Pick; cats: Categories; onChange: (patch: CatPatch) => void; bulk?: boolean }) {
  const toggle = (g: CatGroup, id: string) => {
    const has = assigned(pick, g.id).includes(id)
    if (g.id === 'tone') return onChange({ tone: has && !bulk ? null : id })
    if (bulk) return onChange({ add: { [g.id]: [id] } })
    const cur = assigned(pick, g.id)
    onChange({ [g.id]: has ? cur.filter((x) => x !== id) : [...cur, id] })
  }
  return (
    <div className="flex flex-col gap-2" data-cat-palette>
      {cats.groups.map((g) => {
        const cur = assigned(pick, g.id)
        const orphans = cur.filter((id) => !g.values.some((v) => v.id === id))
        return (
          <div key={g.id}>
            <p className="mb-1 text-xs text-muted-foreground">
              {g.label} {g.multi ? '(any)' : '(one)'}
            </p>
            <div className="flex flex-wrap gap-1">
              {g.values.map((v, i) => {
                const on = !bulk && cur.includes(v.id)
                return (
                  <button key={v.id} type="button" aria-pressed={on} onClick={() => toggle(g, v.id)} className={cn(chip, 'motion-safe:transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                    {v.label}
                    {g.id === 'tone' && !bulk && <kbd className="ml-1 text-[10px] opacity-70">{i + 1}</kbd>}
                  </button>
                )
              })}
              {orphans.map((id) => (
                <button key={id} type="button" aria-pressed onClick={() => toggle({ ...g, values: [{ id, label: id }, ...g.values] }, id)} className={cn(chip, 'border-destructive text-destructive')} title="Removed from the list; click to unassign">
                  ⚠ {id} (removed)
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// /gallery-rank's proposed tone and roles as one button. Only offers what the user has not assigned yet.
export function Suggestion({ pick, rank, cats, onApply }: { pick?: Pick; rank?: Rank; cats: Categories; onApply: (patch: CatPatch) => void }) {
  const s = rank?.suggested
  if (!s) return null
  const tone = s.tone && !pick?.tone && labelOf(cats, 'tone', s.tone) ? s.tone : undefined
  const roles = !pick?.roles?.length ? (s.roles ?? []).filter((r) => labelOf(cats, 'roles', r)) : []
  if (!tone && !roles.length) return null
  const names = [tone && labelOf(cats, 'tone', tone), ...roles.map((r) => labelOf(cats, 'roles', r))].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      data-suggestion
      onClick={() => onApply({ ...(tone ? { tone } : {}), ...(roles.length ? { roles } : {}) })}
      className={cn(chip, 'border-dashed text-left hover:bg-muted')}
      title={s.reason ?? 'Suggested by /gallery-rank'}
    >
      Suggested: {names} <span className="font-medium">+ accept</span>
    </button>
  )
}
