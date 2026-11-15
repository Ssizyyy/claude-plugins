// Downloads the source of catalog items into src/items/<source>/<key>/ (gitignored).
// Usage: node scripts/fetch.mjs [--all] [--force] [--install] [id ...]
//   default   the 82-item proof set (PROOF below)
//   --all     every item in components.json (754)
//   --force   rewrite items already on disk from the cached registry JSON (otherwise only missing or failed ones are fetched; resumable)
//   --refresh also bypass .fetch-cache and download the registry JSON again
//   --install npm-install the packages that "not usable: needs package X" failures asked for, then retry those items
//   id ...    just these catalog ids
// Reads each item's `install` field from components.json, fetches the registry JSON (cached in .fetch-cache/),
// writes its files and records the outcome per item in src/items/_status.json (flushed every few items, so an
// interrupted run resumes). Items tombstoned in picks.json (status "deleted") are never fetched and their folder is
// removed. Third-party source never leaves src/items/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { migrate, picksFile, readJson } from '../data.mjs';
import { basename, dirname, extname, join, posix } from 'node:path';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, '../../plugins/design-stack/skills/ui-component-catalog/catalog/components.json');
const itemsDir = join(root, 'src/items');
const cacheDir = join(root, '.fetch-cache');
const statusPath = join(itemsDir, '_status.json');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const force = flag('--force');
const only = args.filter((a) => !a.startsWith('--'));
const CONCURRENCY = 4;
const DELAY_MS = 150; // pause each worker between requests

const PROOF = new Set([ "uselayouts/3d-book", "uselayouts/accessible-action", "uselayouts/analog-stick", "uselayouts/bucket", "uselayouts/coverflow-drag", "uselayouts/dynamic-grid-gallery", "uselayouts/editorial-deck", "uselayouts/feature-carousel", "uselayouts/fluid-expanding-grid", "uselayouts/focus-testimonials", "uselayouts/folder-interaction", "uselayouts/get-in-touch", "uselayouts/liquid-index", "uselayouts/overlapping-slider", "uselayouts/perspective-text-scroll", "uselayouts/photo-albums", "uselayouts/polaroid-drag", "uselayouts/polaroid-stack", "uselayouts/pop-tilt-cards", "uselayouts/pricing-card", "uselayouts/rolling-card-stack", "uselayouts/shake-testimonial-card", "uselayouts/slide-subscribe", "uselayouts/stacked-outline-text", "uselayouts/wheel-carousel", "react-bits/AnimatedContent", "react-bits/ElectricBorder", "react-bits/FadeContent", "react-bits/GlareHover", "react-bits/GradualBlur", "react-bits/LogoLoop", "react-bits/Magnet", "react-bits/Noise", "react-bits/StarBorder", "react-bits/BlurText", "react-bits/CountUp", "react-bits/GradientText", "react-bits/RotatingText", "react-bits/ScrollReveal", "react-bits/ScrollVelocity", "react-bits/ShinyText", "react-bits/SplitText", "react-bits/TextType", "react-bits/TrueFocus", "react-bits/Shuffle", "react-bits/AnimatedList", "react-bits/CardSwap", "react-bits/Counter", "react-bits/Dock", "react-bits/GlassSurface", "react-bits/GooeyNav", "react-bits/Masonry", "react-bits/PillNav", "react-bits/ScrollStack", "react-bits/SpotlightCard", "react-bits/ScrollExpand", "react-bits/Stack", "react-bits/TiltedCard", "react-bits/Aurora", "react-bits/DarkVeil", "react-bits/Dither", "react-bits/DotGrid", "react-bits/GradientBlinds", "react-bits/Grainient", "react-bits/GridScan", "react-bits/Iridescence", "react-bits/LightRays", "react-bits/LineWaves", "react-bits/SoftAurora", "react-bits/Particles", "react-bits/PixelBlast", "react-bits/Plasma", "react-bits/Silk", "react-bits/Threads", "react-bits/Waves", "react-bits/FloatingLines", "react-bits/SquishSwitch", "react-bits/HoldButton", "react-bits/RubberSegment", "react-bits/JellyRadio", "react-bits/StatusMark", "react-bits/BlobCursor" ]);

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')).items;
migrate(); // picks live in the shared data dir (data.mjs); the first run imports any old in-repo file
const picks = readJson(picksFile, { picks: {} }).picks ?? {};
const items = flag('--all') || only.length ? catalog : catalog.filter((c) => PROOF.has(c.id));

const BASES = { uselayouts: 'https://uselayouts.com/r/' };
function registryUrl(it) {
  const url = it.install.match(/https?:\/\/\S+/)?.[0];
  if (url) return url.endsWith('.json') ? url : `${url}.json`;
  const ns = it.install.match(/@([\w-]+)\/(\S+)/);
  if (ns && BASES[ns[1]]) return `${BASES[ns[1]]}${ns[2]}.json`;
  throw new Error(`cannot derive a registry URL from: ${it.install}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  const cache = join(cacheDir, url.replace(/[^\w.-]+/g, '_'));
  if (!flag('--refresh') && existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8'));
  let json;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    json = await res.json();
  } catch (e) {
    // some networks time out Node's fetch while curl works; a 404 should still fail
    if (/^\d{3}/.test(e.message)) throw new Error(`${url}: ${e.message}`);
    json = JSON.parse(execFileSync('curl', ['-sfL', '-m', '60', url], { maxBuffer: 64 * 1024 * 1024 }).toString());
  }
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cache, JSON.stringify(json));
  return json;
}

// Files keep their folder layout (relative to the item's common folder), so same-named files in different folders
// don't collide. An @/ import is a sibling only if a shipped file's path ends with it (a shipped utils.ts must not
// capture @/lib/utils); it is rewritten to a relative path.
const norm = (p) => p.replace(/\\/g, '/');
const noExt = (p) => p.replace(/\.[jt]sx?$/, '');
function layout(files) {
  // registry paths sometimes start with ../ : drop those segments so nothing is ever written outside the item's folder
  files = files.map((f) => ({ ...f, path: norm(f.path).split('/').filter((x) => x && x !== '.' && x !== '..').join('/') }));
  const dirs = files.map((f) => norm(f.path).split('/').slice(0, -1));
  let common = dirs[0] ?? [];
  for (const d of dirs) {
    let i = 0;
    while (i < common.length && i < d.length && common[i] === d[i]) i++;
    common = common.slice(0, i);
  }
  return files.map((f) => ({ ...f, orig: norm(f.path), rel: norm(f.path).split('/').slice(common.length).join('/') }));
}
const SIB = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '.json', '/index.tsx', '/index.ts'];
// target rel path of an import from file f, or undefined if it is not one of the item's files
function sibling(f, spec, all) {
  if (spec.startsWith('.')) {
    const base = posix.normalize(posix.join(posix.dirname(f.rel), spec));
    const exact = SIB.map((e) => base + e).find((c) => all.some((o) => o.rel === c));
    if (exact) return exact;
    // registry authors' paths (../../../components/ui/x) rarely survive the move: fall back to a file with the same name
    const same = all.filter((o) => basename(noExt(o.rel)) === basename(noExt(spec)) && o !== f);
    return same.length === 1 ? same[0].rel : undefined;
  }
  if (spec.startsWith('@/')) {
    const want = noExt(spec.slice(2));
    const hits = all.filter((o) => [noExt(o.orig), noExt(o.orig).replace(/\/index$/, '')].some((p) => p === want || p.endsWith('/' + want)));
    return hits.sort((a, b) => a.orig.length - b.orig.length)[0]?.rel;
  }
}
const relImport = (from, to) => {
  const r = posix.relative(posix.dirname(from), noExt(to).replace(/\/index$/, ''));
  return r.startsWith('.') ? r : './' + r;
};
function rewriteSiblings(f, all) {
  return f.content.replace(/(from\s+|import\s*\(\s*|import\s+)(['"])([^'"]+)\2/g, (m, pre, q, spec) => {
    if (!spec.startsWith('@/') && !spec.startsWith('.')) return m;
    const t = sibling(f, spec, all);
    if (!t) return m;
    if (spec.startsWith('.') && posix.normalize(posix.join(posix.dirname(f.rel), spec)) === noExt(t)) return m; // already right
    return pre + q + relImport(f.rel, t) + q;
  });
}

// An unresolvable import would fail `vite build` for the whole gallery, so such items are reported here
// instead of being written: they show "won't render" with the reason.
let installed;
const loadInstalled = () => {
  const gallery = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  installed = new Set(Object.keys({ ...gallery.dependencies, ...gallery.devDependencies }));
};
loadInstalled();
// modules the gallery answers with a shim (see vite.config.ts aliases)
const PROVIDED = new Set(['next/image', 'next/link', '@repo/shadcn']);
const EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '/index.tsx', '/index.ts'];
const exists = (base) => EXTS.some((e) => existsSync(base + e));
// returns { msg, pkgs? } for the first problem found (all missing packages of the item are reported together)
function unresolved(files) {
  const pkgs = new Set();
  for (const f of files) {
    if (!/\.[jt]sx?$/.test(f.rel)) continue;
    for (const m of f.content.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        if (!sibling(f, spec, files)) return { msg: `registry item imports ${spec}, which it does not ship` };
      } else if (PROVIDED.has(spec)) {
        continue;
      } else if (spec.startsWith('@/')) {
        if (!sibling(f, spec, files) && !exists(join(root, 'src', spec.slice(2)))) return { msg: `imports ${spec}, which the gallery does not provide` };
      } else {
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!installed.has(pkg) && !spec.startsWith('node:') && !builtinModules.includes(pkg)) pkgs.add(pkg);
      }
    }
  }
  if (pkgs.size) return { msg: `needs package ${[...pkgs].join(', ')}, not installed in the gallery`, pkgs: [...pkgs] };
}

// registry `css` field (nested objects) -> plain CSS text
function cssText(obj, indent = '') {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${indent}${k}: ${v};`;
      if (v && typeof v === 'object' && Object.values(v).every((x) => x && typeof x === 'object' || typeof x === 'string'))
        return `${indent}${k} {\n${cssText(v, indent + '  ')}\n${indent}}`;
      return '';
    })
    .join('\n');
}

const status = existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, 'utf8')) : {};
const css = {};
mkdirSync(itemsDir, { recursive: true });

async function fetchOne(it) {
  const dir = join(itemsDir, it.source, it.key);
  try {
    const reg = await getJson(registryUrl(it));
    const raw = (reg.files ?? []).filter((f) => f.content);
    if (!raw.length) throw new Error('registry item has no file content');
    rmSync(dir, { recursive: true, force: true });
    const all = layout(raw);
    const files = all.map((f) => ({ ...f, content: /\.[jt]sx?$/.test(f.rel) ? rewriteSiblings(f, all) : f.content }));
    const bad = unresolved(files);
    if (bad) {
      const e = new Error(bad.msg);
      e.pkgs = bad.pkgs;
      e.regDeps = reg.dependencies ?? [];
      throw e;
    }
    for (const f of files) {
      mkdirSync(dirname(join(dir, f.rel)), { recursive: true });
      writeFileSync(join(dir, f.rel), f.content);
    }
    const comps = files.map((f) => f.rel).filter((n) => /\.[jt]sx$/.test(n)).sort((a, b) => a.split('/').length - b.split('/').length);
    const stem = (n) => basename(n, extname(n)).toLowerCase();
    const entry = comps.find((n) => stem(n) === it.key.toLowerCase()) ?? comps.find((n) => stem(n) === 'index') ?? comps[0];
    if (!entry) throw new Error('no .tsx/.jsx file in registry item');
    if (reg.css) css[it.id] = cssText(reg.css);
    status[it.id] = { entry, registryDependencies: reg.registryDependencies ?? [], fetchedDeps: reg.dependencies ?? [] };
  } catch (e) {
    const kind = /^registry|^imports|^needs/.test(e.message) ? 'not usable' : /^\S+: 404/.test(e.message) ? 'not found' : 'fetch failed';
    const bare = (d) => d.replace(/@[\^~]?[\d.]+$|@latest$/, '');
    const needs = e.pkgs?.map((p) => e.regDeps?.find((d) => bare(d) === p) ?? p);
    status[it.id] = { error: `${kind}: ${e.message}`, ...(needs ? { needs } : {}) };
  }
}

function flush() {
  // merge css from this run with whatever earlier runs wrote
  const cssPath = join(itemsDir, '_items.css');
  const prev = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
  const keep = prev.split(/\n(?=\/\* )/).filter((b) => b.startsWith('/* ') && !Object.keys(css).some((id) => b.startsWith(`/* ${id} */`)));
  const next = Object.entries(css).filter(([, t]) => t).map(([id, t]) => `/* ${id} */\n${t}`);
  writeFileSync(cssPath, [...keep, ...next].join('\n') + '\n');
  for (const k of Object.keys(css)) delete css[k];
  writeFileSync(statusPath, JSON.stringify(status, null, 1));
}

async function run(list) {
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      await fetchOne(it);
      if (++done % 25 === 0) {
        flush();
        console.log(`  ${done}/${list.length}`);
      }
      await sleep(DELAY_MS);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker));
  flush();
}

let skippedTomb = 0;
let onDisk = 0;
const todo = [];
for (const it of items) {
  if (picks[it.id]?.status === 'deleted') {
    skippedTomb++;
    delete status[it.id];
    rmSync(join(itemsDir, it.source, it.key), { recursive: true, force: true });
    continue;
  }
  if (only.length && !only.includes(it.id)) continue;
  if (!force && !only.length && status[it.id]?.entry && existsSync(join(itemsDir, it.source, it.key, status[it.id].entry))) {
    onDisk++;
    continue;
  }
  todo.push(it);
}
console.log(`${todo.length} to fetch, ${onDisk} already on disk, ${skippedTomb} tombstoned`);
await run(todo);

if (flag('--install')) {
  // never installable here: monorepo-internal names and next (items importing next/* need a Next app)
  const SKIP = /^(@repo\/|next$)/;
  const specs = [...new Set(todo.flatMap((i) => status[i.id]?.needs ?? []))].filter((p) => !SKIP.test(p));
  if (specs.length) {
    console.log(`installing ${specs.length} packages into the gallery`);
    const npm = (a) => execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--save', '--ignore-scripts', '--no-audit', '--no-fund', ...a], { cwd: root, stdio: 'pipe', shell: process.platform === 'win32' });
    try {
      npm(specs);
    } catch {
      for (const p of specs) { // one broken name must not block the rest
        try { npm([p]); } catch { console.log(`  could not install ${p}`); }
      }
    }
    loadInstalled();
    await run(todo.filter((i) => status[i.id]?.needs));
  }
}

// The import checks above can't see everything (a package that lacks a named export, a type imported as a value). A broken
// item would fail vite build for the whole gallery, so build, drop the items the errors point at, and repeat.
// Resolution errors stop the build within seconds, so each round is cheap; the last, passing one takes about a minute.
if (todo.length && !flag('--no-check')) {
  console.log('checking that the gallery still builds...');
  for (let round = 0; round < 10; round++) {
    let log;
    try {
      execFileSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'error'], { cwd: root, stdio: 'pipe', maxBuffer: 1 << 28 });
      break;
    } catch (e) {
      log = (String(e.stdout) + String(e.stderr)).replace(/\x1b\[[0-9;]*m/g, '');
    }
    const bad = new Map();
    for (const m of log.matchAll(/\[([A-Z_]+)\] ([^\n]*)\n\s*\S*\[ (?:\.\/)?src\/items\/([^/]+)\/([^/]+)\//g)) bad.set(m[3] + '/' + m[4], m[2].replace(/ in src\/items.*/, ''));
    if (!bad.size) {
      console.log('build fails for a reason outside src/items:\n' + log.slice(0, 1500));
      process.exitCode = 1;
      break;
    }
    for (const [id, msg] of bad) {
      status[id] = { error: 'not usable: would break the build: ' + msg.slice(0, 120) };
      rmSync(join(itemsDir, id), { recursive: true, force: true });
      todo.some((i) => i.id === id) || todo.push(catalog.find((c) => c.id === id));
    }
    console.log('  dropped ' + bad.size + ' that would break the build');
    flush();
  }
}

const fetchedNow = todo.filter((i) => status[i.id]?.entry).length;
const failed = todo.filter((i) => status[i.id]?.error);
const byKind = {};
for (const i of failed) {
  const k = status[i.id].error.replace(/https?:\/\/\S+/g, '<url>').replace(/, which the gallery does not provide|, which it does not ship|, not installed in the gallery/, '').slice(0, 90);
  (byKind[k] ??= []).push(i.id);
}
console.log(`\nsummary: fetched ${fetchedNow}, already on disk ${onDisk}, skipped ${skippedTomb} tombstoned, failed ${failed.length} (of ${items.length} in scope)`);
for (const [k, ids] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${ids.length}x ${k}${ids.length < 3 ? ` [${ids.join(', ')}]` : ''}`);
