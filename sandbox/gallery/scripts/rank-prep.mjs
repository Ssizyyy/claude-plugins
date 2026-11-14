// Helper for /gallery-rank (.claude/skills/gallery-rank/SKILL.md).
//   node scripts/rank-prep.mjs select <family|source|all> [--limit N] [--force]   print the ids still to rank, one per line
//   node scripts/rank-prep.mjs facts <id ...>                                      print per-item facts as JSON
// select: fetched items (usable source on disk) that are not tombstoned and not already ranked (--force: ranked too),
// unreviewed/candidate first. facts: what can be read off the source without a model (deps, size, reduced-motion and
// ARIA hits, same-family neighbours for the uniqueness call).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : d);
const catalog = json(join(root, '../../plugins/design-stack/skills/ui-component-catalog/catalog/components.json'), { items: [] }).items;
const status = json(join(root, 'src/items/_status.json'), {});
const picks = json(join(root, 'picks.json'), { picks: {} }).picks;
const ranking = json(join(root, 'ranking.json'), []);
const ranked = new Set(ranking.map((r) => r.id));
const [cmd, ...rest] = process.argv.slice(2);
const flag = (f) => rest.includes(f);
const HEAVY = ['gsap', 'ogl', 'three', 'matter-js', 'lenis', 'vgpu', '@react-three'];
const BASIC = new Set(['clsx', 'tailwind-merge', 'react', 'react-dom', 'lucide-react', 'class-variance-authority', 'radix-ui', 'cn']);
const dep = (d) => d.replace(/@[\^~]?[\d.]+$|@latest$/, '');
const weight = (it) => {
  const d = it.dependencies.map(dep);
  return d.some((x) => HEAVY.some((h) => x === h || x.startsWith(h))) ? 'heavy' : d.every((x) => BASIC.has(x)) ? 'basic' : 'extra';
};

if (cmd === 'select') {
  const scope = rest.find((a) => !a.startsWith('--') && a !== rest[rest.indexOf('--limit') + 1]) ?? 'all';
  const limit = flag('--limit') ? Number(rest[rest.indexOf('--limit') + 1]) : Infinity;
  const order = { unreviewed: 0, candidate: 1 };
  const ids = catalog
    .filter((it) => status[it.id]?.entry && picks[it.id]?.status !== 'deleted')
    .filter((it) => scope === 'all' || it.source === scope || it.family === scope)
    .filter((it) => flag('--force') || !ranked.has(it.id))
    .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((it) => it.id);
  console.log(ids.join('\n'));
} else if (cmd === 'facts') {
  const out = rest.map((id) => {
    const it = catalog.find((c) => c.id === id);
    if (!it) return { id, error: 'not in catalog' };
    const dir = join(root, 'src/items', it.source, it.key);
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const src = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    const neighbours = catalog.filter((c) => c.family === it.family && c.id !== id).slice(0, 12).map((c) => `${c.id} (${c.status})`);
    return {
      id,
      title: it.title,
      description: it.description,
      family: it.family,
      status: it.status,
      surface: it.surface,
      motion: it.motion,
      deps: it.dependencies.map(dep),
      depWeight: weight(it),
      sourceDir: `src/items/${it.source}/${it.key}`,
      files: files.map((f) => `${f} (${readFileSync(join(dir, f), 'utf8').split('\n').length} lines)`),
      reducedMotion: /prefers-reduced-motion|useReducedMotion|reducedMotion|motion-reduce|motion-safe/.test(src),
      animates: /framer-motion|motion\/react|gsap|requestAnimationFrame|@keyframes|animate-|transition/.test(src),
      ariaHits: (src.match(/aria-[a-z]+|role=/g) ?? []).length,
      keyboard: /onKeyDown|onKeyUp|tabIndex|<button|<a /.test(src),
      sameFamilyCount: catalog.filter((c) => c.family === it.family).length,
      neighbours,
    };
  });
  console.log(JSON.stringify(out, null, 1));
} else {
  console.error('usage: rank-prep.mjs select <family|source|all> [--limit N] [--force] | facts <id ...>');
  process.exit(2);
}
