// Downloads the source of every proof-set item into src/items/<source>/<key>/ (gitignored).
// Usage: node scripts/fetch.mjs [--force] [id ...]
// Reads each item's `install` field from components.json, fetches the registry JSON, writes its files,
// and records the outcome per item in src/items/_status.json. Items tombstoned in picks.json
// (status "deleted") are skipped. Third-party source never leaves src/items/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, '../../plugins/design-stack/skills/ui-component-catalog/catalog/components.json');
const itemsDir = join(root, 'src/items');
const statusPath = join(itemsDir, '_status.json');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

const proof = JSON.parse(readFileSync(join(root, 'proof-set.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')).items;
const picks = existsSync(join(root, 'picks.json')) ? JSON.parse(readFileSync(join(root, 'picks.json'), 'utf8')).picks ?? {} : {};
const items = [...proof.ids.map((id) => catalog.find((c) => c.id === id)), ...proof.extras].filter(Boolean);

const BASES = { uselayouts: 'https://uselayouts.com/r/' };
function registryUrl(it) {
  const url = it.install.match(/https?:\/\/\S+/)?.[0];
  if (url) return url.endsWith('.json') ? url : `${url}.json`;
  const ns = it.install.match(/@([\w-]+)\/(\S+)/);
  if (ns && BASES[ns[1]]) return `${BASES[ns[1]]}${ns[2]}.json`;
  throw new Error(`cannot derive a registry URL from: ${it.install}`);
}

async function getJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    // some networks time out Node's fetch while curl works; a 404 should still fail
    if (/^\d{3}/.test(e.message)) throw new Error(`${url}: ${e.message}`);
    return JSON.parse(execFileSync('curl', ['-sfL', '-m', '60', url], { maxBuffer: 64 * 1024 * 1024 }).toString());
  }
}

// Registry files can import each other through @/... or relative paths; flatten them into one folder.
function rewriteSiblings(code, names) {
  return code.replace(/(from\s+|import\s*\(\s*|import\s+)(['"])([^'"]+)\2/g, (m, pre, q, spec) => {
    if (!spec.startsWith('@/') && !spec.startsWith('.')) return m;
    const stem = basename(spec).replace(/\.[jt]sx?$/, '');
    return names.has(stem) ? `${pre}${q}./${stem}${q}` : m;
  });
}

// An unresolvable import would fail `vite build` for the whole gallery, so such items are reported here
// instead of being written: they show "won't render" with the reason.
const gallery = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const installed = new Set(Object.keys({ ...gallery.dependencies, ...gallery.devDependencies }));
const EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '/index.tsx', '/index.ts'];
const exists = (base) => EXTS.some((e) => existsSync(base + e));
function unresolved(files, names) {
  for (const f of files) {
    if (!/\.[jt]sx?$/.test(f.path)) continue;
    for (const m of f.content.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        if (!names.has(basename(spec).replace(/\.[jt]sx?$/, ''))) return `registry item imports ${spec}, which it does not ship`;
      } else if (spec.startsWith('@/')) {
        if (!exists(join(root, 'src', spec.slice(2)))) return `imports ${spec}, which the gallery does not provide`;
      } else {
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!installed.has(pkg) && !spec.startsWith('node:') && !builtinModules.includes(pkg)) return `needs package ${pkg}, not installed in the gallery`;
      }
    }
  }
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
    const files = (reg.files ?? []).filter((f) => f.content);
    if (!files.length) throw new Error('registry item has no file content');
    rmSync(dir, { recursive: true, force: true });
    const names = new Set(files.map((f) => basename(f.path).replace(/\.[jt]sx?$/, '')));
    const bad = unresolved(files.map((f) => ({ ...f, content: rewriteSiblings(f.content, names) })), names);
    if (bad) throw new Error(bad);
    mkdirSync(dir, { recursive: true });
    for (const f of files) {
      const body = /\.[jt]sx?$/.test(f.path) ? rewriteSiblings(f.content, names) : f.content;
      writeFileSync(join(dir, basename(f.path)), body);
    }
    const comps = files.map((f) => basename(f.path)).filter((n) => /\.[jt]sx$/.test(n));
    const entry = comps.find((n) => n.replace(extname(n), '').toLowerCase() === it.key.toLowerCase()) ?? comps[0];
    if (!entry) throw new Error('no .tsx/.jsx file in registry item');
    if (reg.css) css[it.id] = cssText(reg.css);
    status[it.id] = { entry, registryDependencies: reg.registryDependencies ?? [], fetchedDeps: reg.dependencies ?? [] };
  } catch (e) {
    status[it.id] = { error: `${/^registry|^imports|^needs/.test(e.message) ? 'not usable' : 'fetch failed'}: ${e.message}` };
  }
}

const todo = [];
let skipped = 0;
for (const it of items) {
  if (picks[it.id]?.status === 'deleted') { skipped++; delete status[it.id]; rmSync(join(itemsDir, it.source, it.key), { recursive: true, force: true }); continue; }
  if (only.length && !only.includes(it.id)) continue;
  if (!force && !only.length && status[it.id]?.entry && existsSync(join(itemsDir, it.source, it.key, status[it.id].entry))) continue;
  todo.push(it);
}
for (let i = 0; i < todo.length; i += 6) await Promise.all(todo.slice(i, i + 6).map(fetchOne));

// merge css from this run with whatever earlier runs wrote
const cssPath = join(itemsDir, '_items.css');
const prev = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
const keep = prev.split(/\n(?=\/\* )/).filter((b) => b.startsWith('/* ') && !Object.keys(css).some((id) => b.startsWith(`/* ${id} */`)));
const next = Object.entries(css).filter(([, t]) => t).map(([id, t]) => `/* ${id} */\n${t}`);
writeFileSync(cssPath, [...keep, ...next].join('\n') + '\n');
writeFileSync(statusPath, JSON.stringify(status, null, 1));

const failed = Object.entries(status).filter(([, s]) => s.error);
console.log(`fetched ${todo.length - todo.filter((i) => status[i.id]?.error).length}/${todo.length}, skipped ${skipped} tombstoned, ${failed.length} failed`);
for (const [id, s] of failed) console.log(`  ${id}: ${s.error}`);
