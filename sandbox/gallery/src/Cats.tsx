import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { assigned, type Categories, type CatPatch, type GroupId, type Pick, type Rank } from './types'

export const labelOf = (cats: Categories, g: GroupId, id: string) => cats.groups.find((x) => x.id === g)?.values.find((v) => v.id === id)?.label

const chip = 'rounded-full border px-2 py-0.5 text-xs'
const values = (cats: Categories, g: GroupId) => cats.groups.find((x) => x.id === g)?.values ?? []

// Tone: one button per value, at most one selected (click the active one to clear). Keys 1-4 do the same on the detail page.
// In bulk mode nothing shows as selected and a click sets the Tone on every ticked card.
export function TonePicker({ pick, cats, onChange, bulk }: { pick?: Pick; cats: Categories; onChange: (patch: CatPatch) => void; bulk?: boolean }) {
  const cur = bulk ? undefined : pick?.tone
  const list = values(cats, 'tone')
  const orphan = cur && !list.some((v) => v.id === cur)
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Tone" data-tone-picker>
      {list.map((v, i) => (
        <Button key={v.id} size="sm" variant={cur === v.id ? 'default' : 'outline'} aria-pressed={cur === v.id} onClick={() => onChange({ tone: cur === v.id ? null : v.id })}>
          {v.label}
          {!bulk && <kbd className="ml-1 text-[10px] opacity-70">{i + 1}</kbd>}
        </Button>
      ))}
      {orphan && (
        <Button size="sm" variant="outline" aria-pressed className="border-destructive text-destructive" onClick={() => onChange({ tone: null })} title="Removed from the list; click to unassign">
          ⚠ {cur} (removed)
        </Button>
      )}
    </div>
  )
}

// Role: one multi-select dropdown. Chosen roles show as small chips next to it (an id removed from the list is flagged).
// In bulk mode a checked value is added to every ticked card (it never removes), and no chips show.
export function RoleSelect({ pick, cats, onChange, bulk }: { pick?: Pick; cats: Categories; onChange: (patch: CatPatch) => void; bulk?: boolean }) {
  const list = values(cats, 'roles')
  const cur = bulk ? [] : assigned(pick, 'roles')
  const orphans = cur.filter((id) => !list.some((v) => v.id === id))
  const set = (id: string, on: boolean) => onChange(bulk ? { add: { roles: [id] } } : { roles: on ? [...cur, id] : cur.filter((x) => x !== id) })
  return (
    <div className="flex flex-wrap items-center gap-1" data-role-select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label="Role">
            {bulk ? 'Add role' : 'Role'}
            {!bulk && cur.length > 0 && <span className="text-muted-foreground">({cur.length})</span>} ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-52 bg-card text-card-foreground ring-border">
          {list.map((v) => (
            <DropdownMenuCheckboxItem key={v.id} className="focus:bg-accent focus:text-accent-foreground" checked={cur.includes(v.id)} onSelect={(e) => e.preventDefault()} onCheckedChange={(on) => set(v.id, on)}>
              {v.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {cur.map((id) => {
        const label = labelOf(cats, 'roles', id)
        return (
          <button key={id} type="button" onClick={() => set(id, false)} className={cn(chip, 'bg-muted hover:bg-muted/70', !label && 'border-destructive text-destructive')} title={label ? 'Click to remove' : 'Removed from the list; click to unassign'}>
            {label ?? `⚠ ${id} (removed)`} ×
          </button>
        )
      })}
      {!bulk && !orphans.length && !cur.length && <span className="text-xs text-muted-foreground">none</span>}
    </div>
  )
}

// /gallery-rank's proposed Tone and Roles as one button that sets both together. Shown only when ranking has a suggestion
// that differs from what the item already has.
export function Suggestion({ pick, rank, cats, onApply }: { pick?: Pick; rank?: Rank; cats: Categories; onApply: (patch: CatPatch) => void }) {
  const s = rank?.suggested
  if (!s) return null
  const tone = s.tone && labelOf(cats, 'tone', s.tone) ? s.tone : undefined
  const roles = (s.roles ?? []).filter((r) => labelOf(cats, 'roles', r))
  if (!tone && !roles.length) return null
  const have = assigned(pick, 'roles')
  if ((!tone || pick?.tone === tone) && roles.every((r) => have.includes(r))) return null
  const names = [tone && labelOf(cats, 'tone', tone), ...roles.map((r) => labelOf(cats, 'roles', r))].filter(Boolean).join(' · ')
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" data-suggestion>
      <Button size="sm" variant="secondary" onClick={() => onApply({ ...(tone ? { tone } : {}), ...(roles.length ? { roles } : {}) })} title={s.reason ?? 'Suggested by /gallery-rank'}>
        Accept suggestion
      </Button>
      <span className="text-muted-foreground">{names}</span>
    </div>
  )
}
