import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import demoProps from '../demo-props.json'
import { CopyButton, FileDiff } from './Diff'
import type { Item } from './types'
import { api, type Plan, type Written } from './variants'

const demo = demoProps as unknown as Record<string, Record<string, unknown>>

// "Copy into a project": pick a project folder (remembered), see where the files would go and what to install, then write.
// Files that already exist and differ are shown as a diff and only overwritten when you tick them; nothing runs npm.
export function ExportDialog({ item, name, onClose }: { item: Item; name: string; onClose: () => void }) {
  const [project, setProject] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [dest, setDest] = useState('')
  const [typed, setTyped] = useState(false) // false: the destination follows components.json
  const [plan, setPlan] = useState<Plan>()
  const [yes, setYes] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<Written>()
  const [error, setError] = useState('')
  const props = useRef(Object.fromEntries(Object.entries(demo[item.id] ?? {}).filter(([k]) => !k.startsWith('_')))).current

  useEffect(() => {
    api.settings().then((s) => {
      setRecent(s.recent)
      if (s.project) setProject(s.project)
    })
  }, [])

  const check = async (useTyped = typed) => {
    setError('')
    setResult(undefined)
    try {
      const p = await api.plan(item, name, project.trim(), useTyped ? dest.trim() || undefined : undefined, props)
      setPlan(p)
      if (!useTyped) setDest(p.dest)
      setYes(new Set())
      const s = await api.project(project.trim()) // remembered only once the folder exists
      setRecent(s.recent)
    } catch (e) {
      setPlan(undefined)
      setError(String(e instanceof Error ? e.message : e))
    }
  }
  const write = async () => {
    setError('')
    try {
      const r = await api.write(item, name, project.trim(), typed ? dest.trim() || undefined : undefined, props, [...yes])
      setResult(r)
      setPlan(r.plan)
      setYes(new Set())
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    }
  }

  const differs = plan?.files.filter((f) => f.exists && !f.same) ?? []
  const fresh = plan?.files.filter((f) => !f.exists) ?? []
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background text-foreground sm:max-w-3xl" data-export-dialog>
        <DialogHeader>
          <DialogTitle>Copy “{name}” into a project</DialogTitle>
          <DialogDescription>Writes the variant’s files into the folder you pick. It never runs npm; it shows the install command instead.</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            check()
          }}
        >
          <label className="text-xs text-muted-foreground" htmlFor="exp-project">
            Project folder (absolute path; remembered)
          </label>
          <div className="flex gap-2">
            <Input id="exp-project" list="exp-recent" value={project} onChange={(e) => setProject(e.target.value)} placeholder="C:\Dev\my-app" autoFocus />
            <datalist id="exp-recent">
              {recent.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <Button type="submit" disabled={!project.trim()}>
              Check
            </Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {plan && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="exp-dest">
                Destination inside the project ({plan.basis})
              </label>
              <div className="flex gap-2">
                <Input id="exp-dest" value={dest} onChange={(e) => (setDest(e.target.value), setTyped(true))} placeholder="src/components/my-variant" />
                <Button variant="outline" onClick={() => check(true)} disabled={!dest.trim()}>
                  Use
                </Button>
              </div>
            </div>

            {plan.files.length > 0 ? (
              <div className="flex flex-col gap-1.5" data-export-files>
                <p className="text-xs text-muted-foreground">
                  {fresh.length} new · {plan.files.filter((f) => f.same).length} identical · {differs.length} would overwrite
                </p>
                {plan.files.map((f) => (
                  <div key={f.rel} className="text-xs">
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate">{f.rel}</code>
                      <span className={cn('rounded px-1.5 py-0.5', !f.exists ? 'bg-success/20' : f.same ? 'bg-muted text-muted-foreground' : 'bg-warning text-warning-foreground')}>{!f.exists ? 'new' : f.same ? 'identical' : 'exists, differs'}</span>
                      {f.exists && !f.same && (
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={yes.has(f.rel)} onChange={() => setYes((s) => (s.has(f.rel) ? new Set([...s].filter((r) => r !== f.rel)) : new Set([...s, f.rel])))} />
                          Overwrite
                        </label>
                      )}
                    </div>
                    {f.exists && !f.same && (f.binary ? <p className="text-muted-foreground">Binary file: no diff.</p> : <FileDiff title={`${f.rel}: existing → variant`} a={f.existing} b={f.incoming} open />)}
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Button onClick={write} disabled={!fresh.length && !yes.size}>
                    Write {fresh.length + yes.size} file{fresh.length + yes.size === 1 ? '' : 's'}
                  </Button>
                  {differs.length > yes.size && <span className="text-xs text-muted-foreground">{differs.length - yes.size} existing file(s) will be left as they are.</span>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No components.json found there, so there is no default place. Type a destination above and press Use.</p>
            )}

            {result && (
              <p className="rounded bg-accent p-2 text-sm text-accent-foreground" role="status" data-export-result>
                Wrote {result.written.length} file(s){result.kept.length ? `, left ${result.kept.length} existing file(s) untouched` : ''}
                {result.same.length ? `, ${result.same.length} identical` : ''}.
              </p>
            )}

            <div className="flex flex-col gap-1 text-sm">
              <h3 className="text-xs font-medium uppercase text-muted-foreground">Install (run it yourself)</h3>
              {plan.install ? (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded bg-muted p-1.5 text-xs">{plan.install}</code>
                  <CopyButton text={plan.install} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No extra npm packages.</p>
              )}
              {plan.shadcn.length > 0 && (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded bg-muted p-1.5 text-xs">npx shadcn@latest add {plan.shadcn.join(' ')}</code>
                  <CopyButton text={`npx shadcn@latest add ${plan.shadcn.join(' ')}`} />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">Usage</h3>
                <CopyButton text={plan.usage} />
              </div>
              <pre className="overflow-auto rounded bg-muted p-2 text-xs">{plan.usage}</pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
