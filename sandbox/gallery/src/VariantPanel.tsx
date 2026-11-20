import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import demoProps from '../demo-props.json'
import { PickControls, type OnPick } from './Card'
import { RoleSelect, TonePicker } from './Cats'
import { CodeEditor } from './CodeEditor'
import { CopyButton, VariantDiff } from './Diff'
import { ExportDialog } from './ExportDialog'
import { Preview, type Stage } from './Preview'
import type { Categories, Item, Picks } from './types'
import { api, describePrompt, slug, variantPickId, type Snap, type VariantList } from './variants'

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

// One slot's files, kept in sync with the dev server. Edits update local state at once and reach disk debounced.
function useSnap(item: Item, slot: string | null, onError: (m: string) => void) {
  const [snap, setSnap] = useState<Snap>()
  const [rev, setRev] = useState(0) // bumped when the content was re-read from disk, so the editor reloads
  const [saving, setSaving] = useState(0)
  const timers = useRef(new Map<string, number>())

  const load = useCallback(async () => {
    if (!slot) return setSnap(undefined)
    try {
      setSnap(await api.files(item, slot))
      setRev((r) => r + 1)
    } catch (e) {
      onError(msg(e))
    }
  }, [item, slot, onError])
  useEffect(() => {
    setSnap(undefined)
    load()
  }, [load])

  const queue = (id: string, ms: number, run: () => Promise<{ dirty: boolean }>) => {
    const had = timers.current.has(id)
    window.clearTimeout(timers.current.get(id))
    if (!had) setSaving((n) => n + 1)
    timers.current.set(
      id,
      window.setTimeout(() => {
        timers.current.delete(id)
        run()
          .then((r) => setSnap((s) => s && { ...s, dirty: r.dirty }))
          .catch((e) => onError(msg(e)))
          .finally(() => setSaving((n) => n - 1))
      }, ms),
    )
  }
  const writeFile = (path: string, content: string) => {
    if (!slot) return
    setSnap((s) => s && { ...s, dirty: true, files: s.files.map((f) => (f.path === path ? { ...f, content } : f)) })
    queue('f:' + path, 350, () => api.file(item, slot, path, content))
  }
  return { snap, rev, saving: saving > 0, reload: load, writeFile }
}

export type Panel = '' | 'code' | 'diff'

// All variant state of the open item: what is shown (original, the draft, a saved variant), an optional second one to compare, and the panel.
export function useVariants(item: Item) {
  const [list, setList] = useState<VariantList>()
  const [view, setView] = useState('original')
  const [cmp, setCmp] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('')
  const [error, setError] = useState('')
  const a = useSnap(item, view === 'original' ? null : view, setError)
  const b = useSnap(item, cmp && cmp !== 'original' ? cmp : null, setError)
  const orig = useSnap(item, panel === 'diff' || cmp === 'original' ? 'original' : null, setError)
  useEffect(() => {
    api.list(item).then(setList, (e) => setError(msg(e)))
  }, [item])

  const run = async (f: () => Promise<VariantList>) => {
    setError('')
    try {
      const l = await f()
      setList(l)
      return l
    } catch (e) {
      setError(msg(e))
    }
  }
  const startDraft = async (fresh = false) => {
    if (await run(() => api.draft(item, fresh))) setView('_draft')
  }
  const names = ['original', ...(list?.draft ? ['_draft'] : []), ...(list?.variants.map((v) => v.name) ?? [])]
  return {
    list,
    view,
    cmp,
    panel,
    error,
    setError,
    a,
    b,
    orig,
    names,
    setView,
    setCmp,
    setPanel,
    startDraft,
    openCode: async () => {
      if (view === 'original') await startDraft()
      setPanel('code')
    },
    saveAs: async (name: string, note?: string) => {
      const n = slug(name)
      const l = await run(() => api.save(item, view, n, note))
      if (l) {
        setView(n)
        if (view !== '_draft') a.reload()
      }
    },
    discard: async () => {
      const l = await run(() => api.discard(item, view))
      if (!l) return
      if (view === '_draft') (setView('original'), setPanel((p) => (p === 'code' ? '' : p)))
      else a.reload()
    },
    rename: async (to: string) => {
      const n = slug(to)
      if (await run(() => api.rename(item, view, n))) setView(n)
    },
    duplicate: async (to: string) => {
      const n = slug(to)
      if (await run(() => api.duplicate(item, view, n))) setView(n)
    },
    remove: async () => {
      if (await run(() => api.remove(item, view))) setView('original')
    },
  }
}
export type V = ReturnType<typeof useVariants>
const label = (slot: string) => (slot === '_draft' ? 'Draft' : slot === 'original' ? 'Original' : slot)

// The preview(s): one slot, or two side by side; with the code editor or the diff underneath.
export function VariantStage({ item, v, stage, width, onState }: { item: Item; v: V; stage: Stage; width?: number; onState: (s: import('./Preview').PreviewState) => void }) {
  const open = !!v.panel
  const pane = (slot: string, snap: Snap | undefined, primary: boolean) => {
    const ready = slot === 'original' || snap?.slot === slot
    return (
      <div className="flex min-w-0 flex-col gap-1" data-slot-view={slot}>
        {v.cmp && <p className="text-xs font-medium">{label(slot)}</p>}
        {ready ? (
          <Preview
            key={item.id + slot}
            item={item}
            stage={stage}
            slot={slot}
            width={v.cmp ? undefined : width}
            eager
            onState={primary ? onState : undefined}
            className={v.cmp ? 'h-[calc(100vh-12rem)] min-h-[20rem]' : open ? 'h-[calc(100vh-31rem)] min-h-[16rem]' : 'h-[calc(100vh-9rem)] min-h-[24rem]'}
          />
        ) : (
          <div className="grid h-40 place-items-center rounded-md border text-xs text-muted-foreground">loading {label(slot)}…</div>
        )}
      </div>
    )
  }
  const other = v.cmp === 'original' ? v.orig.snap : v.b.snap
  return (
    <>
      <div className={cn(v.cmp && 'grid gap-3 md:grid-cols-2')}>
        {pane(v.view, v.a.snap, true)}
        {v.cmp && pane(v.cmp, other, false)}
      </div>
      {v.panel === 'code' && v.view !== 'original' && (
        <div className="mt-3 h-80 overflow-hidden rounded-md border">
          {v.a.snap && v.a.snap.slot === v.view ? <CodeEditor key={v.view} files={v.a.snap.files} entry={item.fetch.entry} reloadKey={v.a.rev} onChange={v.a.writeFile} /> : <p className="p-3 text-xs text-muted-foreground">loading files…</p>}
        </div>
      )}
      {v.panel === 'diff' && (
        <div className="mt-3 max-h-[28rem] overflow-auto rounded-md border">
          {v.view === 'original' ? <p className="p-3 text-xs text-muted-foreground">Pick a variant or the draft to see how it differs from the original.</p> : v.a.snap && v.orig.snap ? <VariantDiff original={v.orig.snap} current={v.a.snap} label={label(v.view)} /> : <p className="p-3 text-xs text-muted-foreground">loading…</p>}
        </div>
      )}
    </>
  )
}

const demo = demoProps as unknown as Record<string, Record<string, unknown>>

// The sidebar part: variants row, actions, describe-the-change prompt, per-variant picks and exports.
export function VariantAside({ item, v, picks, cats, onPick }: { item: Item; v: V; picks: Picks; cats: Categories; onPick: OnPick }) {
  const [inline, setInline] = useState<{ kind: 'save' | 'rename' | 'duplicate'; value: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [exporting, setExporting] = useState(false)
  useEffect(() => (setInline(null), setConfirmDel(false)), [v.view])
  const isVariant = v.view !== 'original' && v.view !== '_draft'
  const vid = isVariant ? variantPickId(item, v.view) : ''
  const vpick = picks[vid]
  const count = v.list?.variants.length ?? 0
  const preferred = picks[item.id]?.preferredVariant
  const sv = v.a.snap
  const dirty = !!sv?.dirty

  const submit = () => {
    if (!inline || !slug(inline.value)) return
    const { kind, value } = inline
    setInline(null)
    if (kind === 'save') v.saveAs(value)
    else if (kind === 'rename') v.rename(value)
    else v.duplicate(value)
  }
  const installPrompt = async () => (await api.plan(item, v.view, '', undefined, Object.fromEntries(Object.entries(demo[item.id] ?? {}).filter(([k]) => !k.startsWith('_'))))).prompt

  return (
    <section className="flex flex-col gap-2 rounded border p-2" aria-label="Variants" data-variants>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Variants ({count})</h3>
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
          {v.a.saving ? 'saving…' : dirty ? 'unsaved changes' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preview source">
        {v.names.map((n) => {
          const st = n === 'original' || n === '_draft' ? undefined : picks[variantPickId(item, n)]?.status
          return (
            <button key={n} type="button" aria-pressed={v.view === n} onClick={() => v.setView(n)} className={cn('rounded-full border px-2.5 py-1 text-xs motion-safe:transition-colors', v.view === n ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}>
              {preferred === n && '★ '}
              {label(n)}
              {n === '_draft' && v.list?.draftDirty && ' •'}
              {st && <span className="ml-1 opacity-80">{st === 'adopted' ? '✓' : st === 'rejected' ? '✕' : '?'}</span>}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">V cycles through them. ★ = marked for design-pass.</p>

      {v.error && (
        <p role="alert" className="text-xs text-destructive">
          {v.error}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {v.view === 'original' && (
          <Button size="sm" onClick={() => v.startDraft()} title="The original is never changed: this makes a working copy to edit">
            Edit a copy
          </Button>
        )}
        {v.view === '_draft' && (
          <>
            <Button size="sm" onClick={() => setInline({ kind: 'save', value: '' })}>
              Save as variant…
            </Button>
            <Button size="sm" variant="outline" onClick={() => v.discard()}>
              Discard draft
            </Button>
          </>
        )}
        {isVariant && (
          <>
            <Button size="sm" disabled={!dirty} onClick={() => v.saveAs(v.view)}>
              Save changes
            </Button>
            <Button size="sm" variant="outline" disabled={!dirty} onClick={() => v.discard()}>
              Discard changes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setInline({ kind: 'rename', value: v.view })}>
              Rename
            </Button>
            <Button size="sm" variant="outline" onClick={() => setInline({ kind: 'duplicate', value: `${v.view}-copy` })}>
              Duplicate
            </Button>
            {confirmDel ? (
              <>
                <Button size="sm" variant="destructive" onClick={() => v.remove()}>
                  Delete “{v.view}”?
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDel(false)}>
                  Keep
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmDel(true)}>
                Delete
              </Button>
            )}
          </>
        )}
      </div>
      {inline && (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Input autoFocus value={inline.value} onChange={(e) => setInline({ ...inline, value: e.target.value })} placeholder="variant name" aria-label={`Variant name (${inline.kind})`} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setInline(null))} />
          <Button type="submit" size="sm" disabled={!slug(inline.value)}>
            {inline.kind === 'save' ? 'Save' : inline.kind === 'rename' ? 'Rename' : 'Duplicate'}
          </Button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <label className="flex items-center gap-1.5">
          Compare with
          <select value={v.cmp ?? ''} onChange={(e) => v.setCmp(e.target.value || null)} className="rounded border bg-background px-1.5 py-1" aria-label="Compare with">
            <option value="">nothing</option>
            {v.names.filter((n) => n !== v.view).map((n) => (
              <option key={n} value={n}>
                {label(n)}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" variant={v.panel === 'diff' ? 'default' : 'outline'} aria-pressed={v.panel === 'diff'} onClick={() => v.setPanel(v.panel === 'diff' ? '' : 'diff')}>
          Diff vs original
        </Button>
        <Button size="sm" variant={v.panel === 'code' ? 'default' : 'outline'} aria-pressed={v.panel === 'code'} onClick={() => (v.panel === 'code' ? v.setPanel('') : v.openCode())}>
          Code
        </Button>
      </div>

      <details open className="text-xs">
        <summary className="cursor-pointer font-medium">Describe the change</summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={3} placeholder="e.g. make the cards smaller and add a hover lift" className="text-sm" aria-label="Describe the change" />
          <div className="flex items-center gap-2">
            <CopyButton label="Copy prompt" variant="secondary" text={() => (sv ? describePrompt(item, label(v.view), sv, instruction) : '')} />
            {(v.view === 'original' || !sv) && <span className="text-muted-foreground">Start a copy first: the prompt names the copy’s files.</span>}
          </div>
          <p className="text-muted-foreground">Builds a prompt with the file paths, your instruction and the repo rules. Paste it into Claude yourself; the page never starts anything.</p>
        </div>
      </details>

      {isVariant && (
        <div className="flex flex-col gap-2 border-t pt-2" data-variant-picks>
          <h4 className="text-xs font-medium">This variant: “{v.view}”</h4>
          {v.list?.variants.find((x) => x.name === v.view)?.meta.created && <p className="text-[11px] text-muted-foreground">created {new Date(v.list.variants.find((x) => x.name === v.view)!.meta.created!).toLocaleString()}</p>}
          <PickControls item={{ ...item, id: vid }} pick={vpick} onPick={onPick} noDelete />
          <TonePicker pick={vpick} cats={cats} onChange={(patch) => onPick(vid, patch)} />
          <RoleSelect pick={vpick} cats={cats} onChange={(patch) => onPick(vid, patch)} />
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => setExporting(true)}>
              Copy into a project…
            </Button>
            <CopyButton label="Copy install prompt" text={installPrompt} />
            <Button size="sm" variant={preferred === v.view ? 'default' : 'outline'} aria-pressed={preferred === v.view} onClick={() => onPick(item.id, { preferredVariant: preferred === v.view ? null : v.view })} title="design-pass will prefer this variant for the item (read in a later change)">
              {preferred === v.view ? '★ Marked for design-pass' : 'Mark for design-pass'}
            </Button>
          </div>
        </div>
      )}
      {exporting && isVariant && <ExportDialog item={item} name={v.view} onClose={() => setExporting(false)} />}
    </section>
  )
}
