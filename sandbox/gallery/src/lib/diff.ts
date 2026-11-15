// Small line diff (LCS) for the variant-vs-original view and the export overwrite prompt.
export type DiffLine = { t: ' ' | '+' | '-'; text: string }

export function diffLines(a: string, b: string): DiffLine[] {
  const x = a.split('\n')
  const y = b.split('\n')
  let s = 0
  while (s < x.length && s < y.length && x[s] === y[s]) s++
  let e = 0
  while (e < x.length - s && e < y.length - s && x[x.length - 1 - e] === y[y.length - 1 - e]) e++
  const mx = x.slice(s, x.length - e)
  const my = y.slice(s, y.length - e)
  const head: DiffLine[] = x.slice(0, s).map((text) => ({ t: ' ', text }))
  const tail: DiffLine[] = x.slice(x.length - e).map((text) => ({ t: ' ', text }))
  if (mx.length * my.length > 4_000_000) return [...head, ...mx.map((text) => ({ t: '-' as const, text })), ...my.map((text) => ({ t: '+' as const, text })), ...tail]
  // lcs[i * w + j] = length of the longest common subsequence of mx[i:] and my[j:]
  const w = my.length + 1
  const lcs = new Uint32Array((mx.length + 1) * w)
  for (let i = mx.length - 1; i >= 0; i--) for (let j = my.length - 1; j >= 0; j--) lcs[i * w + j] = mx[i] === my[j] ? lcs[(i + 1) * w + j + 1] + 1 : Math.max(lcs[(i + 1) * w + j], lcs[i * w + j + 1])
  const mid: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < mx.length && j < my.length) {
    if (mx[i] === my[j]) mid.push({ t: ' ', text: mx[i++] }), j++
    else if (lcs[(i + 1) * w + j] >= lcs[i * w + j + 1]) mid.push({ t: '-', text: mx[i++] })
    else mid.push({ t: '+', text: my[j++] })
  }
  while (i < mx.length) mid.push({ t: '-', text: mx[i++] })
  while (j < my.length) mid.push({ t: '+', text: my[j++] })
  return [...head, ...mid, ...tail]
}

// Keep changed lines with `ctx` lines around them; runs of unchanged lines become one skipped-count row.
export function collapse(lines: DiffLine[], ctx = 3): (DiffLine | { skipped: number })[] {
  const keep = lines.map((_, i) => lines.slice(Math.max(0, i - ctx), i + ctx + 1).some((n) => n.t !== ' '))
  const out: (DiffLine | { skipped: number })[] = []
  let skipped = 0
  lines.forEach((l, i) => {
    if (keep[i]) {
      if (skipped) out.push({ skipped })
      skipped = 0
      out.push(l)
    } else skipped++
  })
  if (skipped) out.push({ skipped })
  return out
}
