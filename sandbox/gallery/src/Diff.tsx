import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { collapse, diffLines } from './lib/diff'
import { COLOR_KEYS, DEFAULTS, type Snap, type Tokens } from './variants'

export function CopyButton({ text, label = 'Copy', size = 'sm', variant = 'outline' }: { text: string | (() => string | Promise<string>); label?: string; size?: 'sm' | 'default'; variant?: 'outline' | 'default' | 'secondary' }) {
  const [done, setDone] = useState<'' | 'copied' | 'failed'>('')
  const copy = async () => {
    const value = typeof text === 'function' ? await text() : text
    try {
      await navigator.clipboard.writeText(value)
      setDone('copied')
    } catch {
      // clipboard blocked (no permission, insecure origin): fall back to a hidden textarea
      const t = document.createElement('textarea')
      t.value = value
      document.body.append(t)
      t.select()
      setDone(document.execCommand('copy') ? 'copied' : 'failed')
      t.remove()
    }
    setTimeout(() => setDone(''), 1800)
  }
  return (
    <Button size={size} variant={variant} onClick={copy} aria-live="polite">
      {done === 'copied' ? 'Copied ✓' : done === 'failed' ? 'Copy failed' : label}
    </Button>
  )
}

// One file's changes, unchanged runs collapsed.
export function FileDiff({ title, a, b, open }: { title: string; a: string; b: string; open?: boolean }) {
  const rows = collapse(diffLines(a, b))
  const changed = rows.filter((r) => 't' in r && r.t !== ' ').length
  return (
    <details open={open} className="rounded border text-xs" data-file-diff={title}>
      <summary className="cursor-pointer px-2 py-1 font-mono">
        {title} <span className="text-muted-foreground">({changed} changed line{changed === 1 ? '' : 's'})</span>
      </summary>
      <pre className="max-h-72 overflow-auto border-t p-0 leading-5">
        {rows.map((r, i) =>
          'skipped' in r ? (
            <div key={i} className="bg-muted px-2 text-muted-foreground">
              … {r.skipped} unchanged line{r.skipped === 1 ? '' : 's'}
            </div>
          ) : (
            <div key={i} className={cn('whitespace-pre px-2', r.t === '+' && 'bg-success/20', r.t === '-' && 'bg-destructive/15')}>
              {r.t} {r.text}
            </div>
          ),
        )}
      </pre>
    </details>
  )
}

const show = (v: unknown, k: string) => (v == null ? `(default${k in DEFAULTS ? ' ' + DEFAULTS[k as keyof typeof DEFAULTS] : ''})` : String(v))

// A variant against the original: changed files (line diff) and token overrides.
export function VariantDiff({ original, current, label }: { original: Snap; current: Snap; label: string }) {
  const before = new Map(original.files.map((f) => [f.path, f]))
  const after = new Map(current.files.map((f) => [f.path, f]))
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort()
  const changed = paths.filter((p) => before.get(p)?.content !== after.get(p)?.content)
  const keys = [...COLOR_KEYS, 'radius', 'spacing', 'scale', 'font'] as const
  const tok = keys.filter((k) => (original.tokens as Tokens)[k] !== (current.tokens as Tokens)[k])
  return (
    <div className="flex flex-col gap-2 p-3 text-sm" data-diff>
      <p className="text-xs text-muted-foreground">
        Original → {label}: {changed.length} file{changed.length === 1 ? '' : 's'} changed, {tok.length} token override{tok.length === 1 ? '' : 's'}.
      </p>
      {tok.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {tok.map((k) => (
              <tr key={k} className="border-b">
                <td className="py-0.5 pr-3 text-muted-foreground">{k}</td>
                <td className="pr-3 font-mono">{show((original.tokens as Tokens)[k], k)}</td>
                <td className="pr-3">→</td>
                <td className="font-mono">{show((current.tokens as Tokens)[k], k)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {changed.map((p) => (
        <FileDiff key={p} title={p + (!before.has(p) ? ' (new)' : !after.has(p) ? ' (removed)' : '')} a={before.get(p)?.content ?? ''} b={after.get(p)?.content ?? ''} open={changed.length <= 2} />
      ))}
      {!changed.length && !tok.length && <p className="text-muted-foreground">No difference from the original.</p>}
    </div>
  )
}
