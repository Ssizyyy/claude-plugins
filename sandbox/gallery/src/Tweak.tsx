import { Button } from '@/components/ui/button'
import { COLOR_KEYS, DEFAULTS, FONTS, PRESETS, type ColorKey, type Tokens } from './variants'
import type { Stage } from './Preview'

const clean = (t: Tokens): Tokens => Object.fromEntries(Object.entries(t).filter(([, v]) => v !== undefined && v !== '')) as Tokens

// Theme values for the preview stage: colours, radius, font, spacing, scale. Unset = the item's own look.
export function Tweak({ tokens, stage, disabled, onChange }: { tokens: Tokens; stage: Stage; disabled?: boolean; onChange: (t: Tokens) => void }) {
  const set = (patch: Tokens) => onChange(clean({ ...tokens, ...patch }))
  const clear = (k: keyof Tokens) => onChange(clean({ ...tokens, [k]: undefined }))
  const slider = (k: 'radius' | 'spacing' | 'scale', label: string, min: number, max: number, step: number, unit: string) => (
    <div className="flex items-center gap-2" key={k}>
      <label className="w-16 text-muted-foreground" htmlFor={`tk-${k}`}>
        {label}
      </label>
      <input id={`tk-${k}`} type="range" min={min} max={max} step={step} disabled={disabled} value={tokens[k] ?? DEFAULTS[k]} onChange={(e) => set({ [k]: Number(e.target.value) })} className="min-w-0 flex-1" />
      <span className="w-14 text-right tabular-nums">
        {tokens[k] ?? DEFAULTS[k]}
        {unit}
      </span>
      <button type="button" disabled={disabled || tokens[k] == null} onClick={() => clear(k)} className="w-4 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Unset ${label}`} title="Unset">
        ×
      </button>
    </div>
  )
  return (
    <div className="flex flex-col gap-2 text-xs" data-tweak>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <Button key={p.id} size="sm" variant="outline" disabled={disabled} onClick={() => onChange(clean({ ...tokens, ...p[stage] }))} title={`Apply the ${p.label} preset for the ${stage} stage (keeps your other values)`}>
            {p.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" disabled={disabled || !Object.keys(tokens).length} onClick={() => onChange({})}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {COLOR_KEYS.map((k: ColorKey) => (
          <div key={k} className="flex items-center gap-1.5">
            <input type="color" id={`tk-${k}`} disabled={disabled} value={tokens[k] ?? '#808080'} onChange={(e) => set({ [k]: e.target.value })} className={`h-6 w-7 shrink-0 cursor-pointer rounded border bg-transparent p-0 ${tokens[k] ? '' : 'opacity-40'}`} aria-label={`${k} colour`} />
            <label htmlFor={`tk-${k}`} className="min-w-0 flex-1 truncate">
              {k}
            </label>
            <button type="button" disabled={disabled || !tokens[k]} onClick={() => clear(k)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Unset ${k}`} title="Unset">
              ×
            </button>
          </div>
        ))}
      </div>
      {slider('radius', 'Radius', 0, 2, 0.05, 'rem')}
      {slider('spacing', 'Spacing', 0.15, 0.4, 0.01, 'rem')}
      {slider('scale', 'Scale', 0.7, 1.5, 0.05, '×')}
      <div className="flex items-center gap-2">
        <label className="w-16 text-muted-foreground" htmlFor="tk-font">
          Font
        </label>
        <select id="tk-font" disabled={disabled} value={tokens.font ?? ''} onChange={(e) => set({ font: e.target.value || undefined })} className="min-w-0 flex-1 rounded border bg-background px-1.5 py-1 text-foreground">
          <option value="">item default</option>
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-muted-foreground">Applied as CSS variables on the stage, so it works for items that use shadcn-style tokens (bg-primary, rounded-lg, p-4). Items with hard-coded colours only follow the background and font.</p>
    </div>
  )
}
