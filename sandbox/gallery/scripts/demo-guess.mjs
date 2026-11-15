// Adds demo-props.json entries, in bulk, for items that failed or rendered blank in a `shots.mjs --probe` run.
// Usage: node scripts/demo-guess.mjs <probe.jsonl>
// For each such item without an entry it reads the main Props interface, and fills every required prop by its type:
// arrays of sample rows, strings, numbers, and `children` (as _children). Existing entries are never changed.
// Components that need a provider, a context or a specific data shape stay failures: that is a listed cause, not a bug.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const status = JSON.parse(readFileSync(join(root, 'src/items/_status.json'), 'utf8'));
const demoPath = join(root, 'demo-props.json');
const demo = JSON.parse(readFileSync(demoPath, 'utf8'));
const probe = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const row = (i) => ({ id: `row-${i}`, key: `row-${i}`, name: `Item ${i}`, title: `Item ${i}`, label: `Item ${i}`, value: `v${i}`, description: `Sample description ${i}`, text: `Sample text ${i}`, src: `https://picsum.photos/seed/g${i}/400/300`, image: `https://picsum.photos/seed/g${i}/400/300`, href: '#', url: '#', date: `2026-0${i}-1${i}`, price: 10 * i, amount: 10 * i, status: 'done', color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'][i - 1] });
const rows = [1, 2, 3, 4].map(row);

function guess(src) {
  const iface = [...src.matchAll(/(?:interface|type)\s+(\w*Props)\b[^{=]*[={]\s*\{?([\s\S]*?)\n\}/g)][0];
  if (!iface) return undefined;
  const out = {};
  for (const m of iface[2].matchAll(/^\s*(\w+)(\??):\s*([^;\n]+)/gm)) {
    const [, name, opt, type] = m;
    if (opt) continue;
    const t = type.trim();
    if (name === 'children') out._children = 'Sample content';
    else if (/\[\]$|^Array<|^readonly .*\[\]$/.test(t)) out[name] = rows;
    else if (/^string\b/.test(t)) out[name] = /url|src|image|href/i.test(name) ? 'https://picsum.photos/seed/g/400/300' : 'Sample';
    else if (/^number\b/.test(t)) out[name] = 3;
  }
  return Object.keys(out).length ? out : undefined;
}

let added = 0;
for (const p of probe) {
  if (p.state === 'rendered' || demo[p.id] || !status[p.id]?.entry) continue;
  const g = guess(readFileSync(join(root, 'src/items', p.id, status[p.id].entry), 'utf8'));
  if (g) {
    demo[p.id] = g;
    added++;
  }
}
writeFileSync(demoPath, JSON.stringify(demo, null, 1) + '\n');
console.log(`added ${added} demo-props entries`);
