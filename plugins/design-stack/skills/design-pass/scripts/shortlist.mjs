#!/usr/bin/env node
// Shortlist for design-pass "Choose components". Node only, no dependencies, no network.
//   shortlist.mjs build   --needs needs.json --run <id> [--mode safe|free] [--project <dir>] [--surface app|marketing] [--showpiece]
//   shortlist.mjs resolve --run <id>              final choice per need (skipped -> default, "none" -> null) and packages to add
//   shortlist.mjs used    --run <id>              record the final choices: status `used` in picks.json, result + kit files
// needs.json: { "needs": [{ "id": "tabs", "label": "Tabs", "scope": "shared"|"page", "page": "Orders", "terms": ["tabs"], "roles": ["navigation"] }] }
// Data dir: UI_GALLERY_DATA_DIR or ~/.claude/ui-gallery. Files: picks.json, ranking.json, runs/<id>.json, <id>.selection.json,
// <id>.result.json, <id>.swaps.json, kit-<project>.json (shared choices reused by later runs).
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogDir = join(here, '../../ui-component-catalog/catalog');
const dataDir = process.env.UI_GALLERY_DATA_DIR || join(homedir(), '.claude', 'ui-gallery');
const runsDir = join(dataDir, 'runs');

const read = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};
const write = (p, v) => {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(v, null, 2) + '\n');
  renameSync(tmp, p);
};

const BASELINE = /^(clsx|tailwind-merge|class-variance-authority|lucide-react|react|react-dom|radix-ui|@radix-ui\/.+|@types\/.+|tw-animate-css|tailwindcss-animate)$/;
const STATUS = { used: 6, adopted: 5, candidate: 2 };
const TONE = { 'serious-product': 1.5, 'serious-brand': 1 };
const EXTRAS = [
  { kind: 'background', families: ['backgrounds', 'bg-blocks', 'noise-effect', 'liquid-gradient', 'blurvignette'], role: 'backgrounds' },
  { kind: 'text effect', families: ['text-animations', 'text-animation'], role: 'text-effects' },
  { kind: 'divider', terms: ['divider', 'separator'] },
  { kind: 'loader', terms: ['loader', 'spinner', 'skeleton'], role: 'loaders' },
];

export const stripVersion = (d) => d.replace(/(?<=.)@[^/]*$/, '');
export const newPackages = (item, have) => [...new Set((item.dependencies ?? []).map(stripVersion))].filter((d) => !BASELINE.test(d) && !have.has(d));

// Pure: the ranked list for one need. `ctx` = { picks, ranking, deleted, have, mode, surface, showpiece }.
export function rank(items, need, ctx) {
  const terms = (need.terms?.length ? need.terms : [need.id]).map((t) => t.toLowerCase());
  const out = [];
  for (const it of items) {
    const pick = ctx.picks[it.id] ?? {};
    const status = pick.status ?? it.status;
    if (status === 'rejected' || status === 'deleted' || ctx.deleted.has(it.id)) continue;
    if (pick.tone === 'showpiece' && !ctx.showpiece) continue;
    const name = `${it.key} ${it.title}`.toLowerCase();
    const body = `${it.description} ${it.note ?? ''}`.toLowerCase();
    let hit = 0;
    for (const t of terms) {
      const w = new RegExp(`(^|[^a-z])${t.replace(/[^a-z0-9 -]/g, '')}(s|es)?([^a-z]|$)`);
      hit += (w.test(name) ? 4 : 0) + (w.test(it.family.toLowerCase()) ? 3 : 0) + (w.test(body) ? 0.5 : 0);
    }
    hit += need.families?.includes(it.family) ? 3 : 0;
    if (hit < 3) continue; // a description mention alone is not a match
    const surface = it.surface === 'marketing' && ctx.surface === 'app' ? -2 : it.surface === 'app' || it.surface === 'both' ? 1 : 0;
    const score = hit + (STATUS[status] ?? 0) + (ctx.ranking[it.id]?.score ?? 0) + (pick.preferredVariant ? 3 : 0) + (TONE[pick.tone] ?? 0) + surface + (need.roles?.some((r) => pick.roles?.includes(r)) ? 2 : 0);
    out.push({ id: it.id, score: Math.round(score * 10) / 10, status, title: it.title, family: it.family, packages: newPackages(it, ctx.have) });
  }
  return out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

// Safe mode hides items that add a package: they are kept in `withPackages`. Free mode lists them inline (still flagged).
function group(list, ctx) {
  const open = ctx.mode === 'safe' ? list.filter((o) => !o.packages.length) : list;
  const gated = ctx.mode === 'safe' ? list.filter((o) => o.packages.length) : [];
  return { default: open[0]?.id ?? null, alternatives: open.slice(1, 5).map((o) => o.id), withPackages: gated.slice(0, 4).map((o) => o.id), options: list.length };
}

function extras(items, ctx) {
  const lists = EXTRAS.map((e) => ({ kind: e.kind, list: rank(items, { id: e.kind, terms: e.terms ?? [], families: e.families, roles: e.role ? [e.role] : [] }, ctx).filter((o) => ctx.mode === 'free' || !o.packages.length).filter((o) => o.status in STATUS || (ctx.ranking[o.id]?.score ?? 0) >= 3.5) }));
  const out = [];
  for (let i = 0; out.length < 6 && lists.some((l) => l.list[i]); i++) for (const l of lists) if (l.list[i] && out.length < 6) out.push({ id: l.list[i].id, kind: l.kind, packages: l.list[i].packages });
  return out;
}

const arg = (name, argv) => {
  const i = argv.indexOf(`--${name}`);
  return i < 0 ? undefined : argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[i + 1];
};
const fail = (m) => (console.error(m), process.exit(1));
const runFile = (id, ext = '') => join(runsDir, `${id}${ext}.json`);

function build(argv) {
  const id = arg('run', argv);
  const needsFile = arg('needs', argv);
  if (!id || !needsFile) fail('usage: build --needs needs.json --run <id> [--mode safe|free] [--project dir] [--surface app|marketing] [--showpiece]');
  const mode = arg('mode', argv) === 'free' ? 'free' : 'safe';
  const project = resolve(arg('project', argv) || '.');
  const pkg = read(join(project, 'package.json'), {});
  const have = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
  // items the gallery tried and could not render are not offered (only known when UI_GALLERY_DIR points at a fetched checkout)
  const broken = read(join(process.env.UI_GALLERY_DIR || '.', 'src/items/_status.json'), {});
  const catalog = read(join(catalogDir, 'components.json'), { items: [] }).items.filter((i) => !broken[i.id]?.error || broken[i.id].error.startsWith('not fetched'));
  const curated = read(join(catalogDir, 'curated.json'), {});
  const ctx = {
    picks: read(join(dataDir, 'picks.json'), { picks: {} }).picks ?? {},
    ranking: Object.fromEntries(read(join(dataDir, 'ranking.json'), []).map((r) => [r.id, r])),
    deleted: new Set(curated.deleted ?? []),
    have,
    mode,
    surface: arg('surface', argv) === 'marketing' ? 'marketing' : 'app',
    showpiece: !!arg('showpiece', argv) && mode === 'free',
  };
  const kit = read(runFile(`kit-${basename(project)}`), { choices: {} }).choices;
  const needs = read(needsFile, { needs: [] }).needs.map((n) => {
    const fixed = n.scope === 'shared' ? kit[n.id] : undefined;
    return { id: n.id, label: n.label ?? n.id, scope: n.scope ?? 'page', page: n.page, ...(fixed ? { fixed } : group(rank(catalog, n, ctx), ctx)) };
  });
  const ex = extras(catalog, ctx);
  const packages = {};
  for (const o of [...needs.flatMap((n) => [...(n.alternatives ?? []), ...(n.withPackages ?? [])]).map((i) => ({ id: i })), ...ex]) { const it = catalog.find((c) => c.id === o.id); const p = it ? newPackages(it, have) : []; if (p.length) packages[o.id] = p; }
  for (const n of needs) { const d = catalog.find((i) => i.id === n.default); if (d && newPackages(d, have).length) packages[d.id] = newPackages(d, have); }
  const run = { id, created: new Date().toISOString(), mode, project: basename(project), needs, extras: ex.map(({ id, kind }) => ({ id, kind })), packages };
  write(runFile(id), run);
  return run;
}

// Selection file: { done: true, choices: { <needId>: "<itemId>" | "none" }, extras: ["<itemId>"] }. Absent need = skipped.
function resolveRun(argv) {
  const id = arg('run', argv) || fail('usage: resolve --run <id>');
  const run = read(runFile(id)) || fail(`no run file ${runFile(id)}`);
  const sel = read(runFile(id, '.selection'), { choices: {}, extras: [] });
  const choices = {};
  for (const n of run.needs) {
    const c = n.fixed ?? sel.choices?.[n.id] ?? n.default;
    choices[n.id] = c && c !== 'none' ? c : null;
  }
  const picked = [...new Set([...Object.values(choices).filter(Boolean), ...(sel.extras ?? [])])];
  const packages = {};
  for (const item of picked) for (const p of run.packages?.[item] ?? []) (packages[p] ??= []).push(item);
  return { run: id, selectionFound: existsSync(runFile(id, '.selection')), skipped: run.needs.filter((n) => !n.fixed && !(n.id in (sel.choices ?? {}))).map((n) => n.id), choices, extras: sel.extras ?? [], packages };
}

function used(argv) {
  const r = resolveRun(argv);
  const run = read(runFile(r.run));
  const picksPath = join(dataDir, 'picks.json');
  const file = read(picksPath, { picks: {} });
  const at = new Date().toISOString();
  const items = [...new Set([...Object.values(r.choices).filter(Boolean), ...r.extras])];
  for (const id of items) file.picks[id] = { ...file.picks[id], status: 'used', at };
  write(picksPath, file);
  const kitPath = runFile(`kit-${run.project}`);
  const kit = read(kitPath, { choices: {} });
  for (const n of run.needs) if (n.scope === 'shared' && r.choices[n.id]) kit.choices[n.id] = r.choices[n.id];
  write(kitPath, kit);
  write(runFile(r.run, '.result'), { ...r, recordedAt: at });
  return { recorded: items.length, packages: r.packages };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...argv] = process.argv.slice(2);
  const fn = { build, resolve: resolveRun, used }[cmd] ?? fail('commands: build | resolve | used');
  const r = fn(argv);
  console.log(JSON.stringify(cmd === 'build' ? { run: r.id, file: runFile(r.id), mode: r.mode, needs: r.needs.map((n) => ({ need: n.id, scope: n.scope, default: n.default ?? n.fixed, alts: n.alternatives?.length ?? 0, withPackages: n.withPackages?.length ?? 0, options: n.options })), extras: r.extras.length } : r, null, 2));
}
