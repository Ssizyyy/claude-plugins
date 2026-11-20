// Local variants of gallery items: the dev-server side of the component editor. Plain ESM, used by vite.config.ts.
//
// Where things live:
//   saved variants   <data dir>/variants/<source>/<key>/<name>/{files/, meta.json}   (user data, never in the repo)
//   working copies   src/work/<source>/<key>/<slot>/{files/}                                      (gitignored scratch that Vite serves)
// A slot is "_draft" (an unsaved edit of the original) or the name of a saved variant. The original in src/items/ is
// never written. Vite renders the working copy (root-relative path, so HMR and node_modules resolution just work);
// "Save" copies the working copy into the data dir. Third-party source therefore never lands anywhere git tracks.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataDir, picksFile, readJson, writeData } from './data.mjs';

const root = dirname(fileURLToPath(import.meta.url));
export const itemsDir = join(root, 'src', 'items');
export const workDir = join(root, 'src', 'work');
export const variantsDir = join(dataDir, 'variants');
const settingsFile = join(dataDir, 'settings.json');
const DRAFT = '_draft';
const EDITABLE = /\.(tsx?|jsx?|css|json|md)$/;
const MAX_FILE = 400_000;

const SEG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const seg = (s, what) => {
  if (typeof s !== 'string' || !SEG.test(s) || s.includes('..')) throw new Error(`bad ${what}`);
  return s;
};
const slotOf = (s) => (s === DRAFT ? DRAFT : seg(s, 'variant name'));
const nameOf = (s) => {
  const n = seg(String(s ?? '').trim().replace(/\s+/g, '-'), 'variant name (letters, digits, . _ -)');
  if (n === DRAFT) throw new Error('reserved name');
  return n;
};
// a path coming from the page must stay inside the folder it is joined to
const inside = (base, rel) => {
  const p = resolve(base, rel);
  if (p !== base && !p.startsWith(base + sep)) throw new Error('path escapes the folder');
  return p;
};

const orig = (source, key) => {
  const d = join(itemsDir, seg(source, 'source'), seg(key, 'key'));
  if (!existsSync(d)) throw new Error('item source not on disk: run npm run gallery:fetch');
  return d;
};
const work = (source, key, slot) => join(workDir, seg(source, 'source'), seg(key, 'key'), slotOf(slot));
const saved = (source, key, name) => join(variantsDir, seg(source, 'source'), seg(key, 'key'), nameOf(name));

// ---------- files ----------
function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out.sort();
}
const copyTree = (from, to) => {
  for (const rel of walk(from)) {
    const dest = join(to, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(from, rel), dest);
  }
};
const sameTree = (a, b) => {
  const fa = walk(a);
  const fb = walk(b);
  return fa.length === fb.length && fa.every((f, i) => f === fb[i] && readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
};
const writeAtomic = (file, text) => {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
};
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

// Deleted or replaced variants are moved here, not erased.
function trash(dir, label) {
  if (!existsSync(dir)) return;
  const to = join(variantsDir, '.trash', `${stamp()}-${label}`);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(dir, to);
}

// ---------- working copies ----------
// Make sure the slot has a working copy and return its folder. Draft: copy of the original. Variant: copy of the saved one.
function ensureWork(source, key, slot, fresh = false) {
  const w = work(source, key, slot);
  if (fresh) rmSync(w, { recursive: true, force: true });
  if (existsSync(join(w, 'files'))) return w;
  if (slot === DRAFT) {
    copyTree(orig(source, key), join(w, 'files'));
  } else {
    const s = saved(source, key, slot);
    if (!existsSync(join(s, 'files'))) throw new Error('no such variant');
    copyTree(join(s, 'files'), join(w, 'files'));
  }
  return w;
}

const isDirty = (source, key, slot) => {
  const w = work(source, key, slot);
  if (!existsSync(join(w, 'files'))) return false;
  if (slot === DRAFT) return !sameTree(join(w, 'files'), orig(source, key));
  const s = saved(source, key, slot);
  return !sameTree(join(w, 'files'), join(s, 'files'));
};

function snapshot(source, key, slot) {
  const original = slot === 'original';
  const dir = original ? orig(source, key) : join(ensureWork(source, key, slot), 'files');
  const files = walk(dir).map((path) => {
    const abs = join(dir, path);
    const editable = EDITABLE.test(path) && statSync(abs).size <= MAX_FILE;
    return { path, editable, content: editable ? readFileSync(abs, 'utf8') : '' };
  });
  return { slot, dir, files, dirty: original ? false : isDirty(source, key, slot) };
}

// ---------- picks keyed by "<item id>#<variant>" ----------
const variantId = (source, key, name) => `${source}/${key}#${name}`;
function movePicks(source, key, from, to) {
  const file = readJson(picksFile, { picks: {} });
  const a = variantId(source, key, from);
  if (!file.picks?.[a]) return;
  if (to) file.picks[variantId(source, key, to)] = file.picks[a];
  if (to !== from) delete file.picks[a];
  writeData(picksFile, file);
}
function dropPreferred(source, key, name) {
  const file = readJson(picksFile, { picks: {} });
  const p = file.picks?.[`${source}/${key}`];
  if (p?.preferredVariant === name) {
    delete p.preferredVariant;
    if (!p.status && !p.note && !p.tone && !p.roles && !p.styles) delete file.picks[`${source}/${key}`];
    writeData(picksFile, file);
  }
}
function renamePreferred(source, key, from, to) {
  const file = readJson(picksFile, { picks: {} });
  const p = file.picks?.[`${source}/${key}`];
  if (p?.preferredVariant === from) {
    p.preferredVariant = to;
    writeData(picksFile, file);
  }
}

// ---------- variants ----------
function list(source, key) {
  const d = join(variantsDir, seg(source, 'source'), seg(key, 'key'));
  const variants = existsSync(d)
    ? readdirSync(d, { withFileTypes: true })
        .filter((e) => e.isDirectory() && existsSync(join(d, e.name, 'files')))
        .map((e) => ({ name: e.name, meta: readJson(join(d, e.name, 'meta.json'), {}) }))
        .sort((a, b) => (a.meta.created ?? '').localeCompare(b.meta.created ?? ''))
    : [];
  return { variants, draft: existsSync(join(work(source, key, DRAFT), 'files')), draftDirty: isDirty(source, key, DRAFT), dir: d };
}

function save({ source, key, slot, name, note }) {
  const n = nameOf(name);
  const w = ensureWork(source, key, slotOf(slot));
  const target = saved(source, key, n);
  const old = readJson(join(target, 'meta.json'), null);
  if (existsSync(target) && slot !== n) throw new Error(`a variant named "${n}" already exists`);
  const tmp = `${target}.tmp-${process.pid}`;
  rmSync(tmp, { recursive: true, force: true });
  copyTree(join(w, 'files'), join(tmp, 'files'));
  const now = new Date().toISOString();
  writeFileSync(join(tmp, 'meta.json'), JSON.stringify({ parent: `${source}/${key}`, created: old?.created ?? now, updated: now, note: note ?? old?.note ?? '', entry: entryOf(source, key) }, null, 2) + '\n');
  trash(target, `${source}-${key}-${n}-replaced`);
  mkdirSync(dirname(target), { recursive: true });
  renameSync(tmp, target);
  if (slot === DRAFT) rmSync(w, { recursive: true, force: true }); // the draft became the variant
  return list(source, key);
}

// the entry file of an item, from the fetch status, so exports can show a usage snippet
const entryOf = (source, key) => readJson(join(itemsDir, '_status.json'), {})[`${source}/${key}`]?.entry ?? '';

function rename({ source, key, name, to }) {
  const a = saved(source, key, name);
  const b = saved(source, key, to);
  if (!existsSync(a)) throw new Error('no such variant');
  if (existsSync(b)) throw new Error(`a variant named "${nameOf(to)}" already exists`);
  renameSync(a, b);
  rmSync(work(source, key, name), { recursive: true, force: true });
  rmSync(work(source, key, nameOf(to)), { recursive: true, force: true });
  movePicks(source, key, name, nameOf(to));
  renamePreferred(source, key, name, nameOf(to));
  return list(source, key);
}

function duplicate({ source, key, name, to }) {
  const a = saved(source, key, name);
  const b = saved(source, key, to);
  if (!existsSync(a)) throw new Error('no such variant');
  if (existsSync(b)) throw new Error(`a variant named "${nameOf(to)}" already exists`);
  copyTree(a, b);
  const meta = readJson(join(b, 'meta.json'), {});
  const now = new Date().toISOString();
  writeFileSync(join(b, 'meta.json'), JSON.stringify({ ...meta, created: now, updated: now, from: name }, null, 2) + '\n');
  return list(source, key);
}

function remove({ source, key, name }) {
  trash(saved(source, key, name), `${source}-${key}-${nameOf(name)}`);
  rmSync(work(source, key, name), { recursive: true, force: true });
  const file = readJson(picksFile, { picks: {} });
  if (file.picks?.[variantId(source, key, name)]) {
    delete file.picks[variantId(source, key, name)];
    writeData(picksFile, file);
  }
  dropPreferred(source, key, name);
  return list(source, key);
}

// ---------- export into a project ----------
const readSettings = () => readJson(settingsFile, { project: '', recent: [] });
const setProject = (p) => {
  const dir = resolve(String(p));
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error('not a folder');
  const s = readSettings();
  const next = { project: dir, recent: [dir, ...s.recent.filter((r) => r !== dir)].slice(0, 6) };
  writeAtomic(settingsFile, JSON.stringify(next, null, 2) + '\n');
  return next;
};

const stripJsonc = (t) => t.replace(/\/\*[\s\S]*?\*\/|(^|[^:"'\\])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1');
// "@/components/ui" → <project>/src/components/ui, following tsconfig/jsconfig paths when present, else src/ if it exists
function aliasDir(project, alias) {
  for (const f of ['tsconfig.json', 'tsconfig.app.json', 'jsconfig.json']) {
    const p = join(project, f);
    if (!existsSync(p)) continue;
    try {
      const paths = JSON.parse(stripJsonc(readFileSync(p, 'utf8'))).compilerOptions?.paths ?? {};
      for (const [pat, [target]] of Object.entries(paths)) {
        const head = pat.replace(/\*$/, '');
        if (pat.endsWith('*') && alias.startsWith(head) && target) return join(project, target.replace(/\*$/, ''), alias.slice(head.length));
      }
    } catch {
      /* fall through to the default */
    }
  }
  const rest = alias.replace(/^[@~]\//, '');
  return join(project, existsSync(join(project, 'src')) ? 'src' : '', rest);
}

const IGNORE_PKG = /^(react|react-dom|react\/.*|react-dom\/.*|next|next\/.*|@repo\/.*)$/;
const pkgName = (s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);
function scanImports(texts) {
  const deps = new Set();
  const shadcn = new Set();
  for (const t of texts) {
    for (const m of t.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const s = m[1];
      const ui = s.match(/^@\/components\/ui\/([\w-]+)/);
      if (ui) shadcn.add(ui[1]);
      else if (!s.startsWith('.') && !s.startsWith('@/') && !s.startsWith('~/') && !IGNORE_PKG.test(s)) deps.add(pkgName(s));
    }
  }
  return { deps: [...deps].sort(), shadcn: [...shadcn].sort() };
}

const lockCmd = (project, deps) => {
  const has = (f) => existsSync(join(project, f));
  const run = has('pnpm-lock.yaml') ? 'pnpm add' : has('yarn.lock') ? 'yarn add' : has('bun.lock') || has('bun.lockb') ? 'bun add' : 'npm install';
  return deps.length ? `${run} ${deps.join(' ')}` : '';
};

function exportPlan({ source, key, name, project, dest, itemDeps = [], props = {}, title = key }) {
  const n = nameOf(name);
  const v = saved(source, key, n);
  if (!existsSync(join(v, 'files'))) throw new Error('no such variant');
  const files = walk(join(v, 'files'));
  const text = (f) => readFileSync(join(v, 'files', f), 'utf8');
  const code = files.filter((f) => /\.(tsx?|jsx?)$/.test(f));
  const { deps: scanned, shadcn } = scanImports(code.map(text));
  const deps = [...new Set([...scanned, ...itemDeps.map((d) => String(d).replace(/@[\^~]?[\d.]+$|@latest$/, '')).filter((d) => !IGNORE_PKG.test(d))])].sort();
  const entry = readJson(join(v, 'meta.json'), {}).entry || entryOf(source, key);
  const folder = `${key}-${n}`.replace(/[^A-Za-z0-9._-]/g, '-');

  let comps = null;
  let alias = '';
  let base = '';
  let basis = '';
  const plan = { name: n, folder, entry, deps, shadcn, project: '', dest: '', basis: '', files: [], install: '', usage: '' };
  if (project) {
    const proj = resolve(project);
    if (!existsSync(proj) || !statSync(proj).isDirectory()) throw new Error('project folder does not exist');
    plan.project = proj;
    comps = readJson(join(proj, 'components.json'), null);
    alias = comps?.aliases?.components ?? (comps?.aliases?.ui ? posix.dirname(comps.aliases.ui) : '');
    if (alias) {
      base = join(aliasDir(proj, alias), folder);
      basis = `components.json: ${alias} → ${relative(proj, base) || '.'}`;
    }
    if (dest) {
      base = inside(proj, dest);
      basis = 'destination you typed';
    }
    plan.basis = basis || 'no components.json: type a destination folder';
    plan.install = lockCmd(proj, deps);
    if (base) {
      plan.dest = relative(proj, base) || '.';
      const all = [...files.map((f) => ({ rel: f, incoming: readFileSync(join(v, 'files', f)) }))];
      plan.files = all.map(({ rel, incoming }) => {
        const abs = join(base, rel);
        const exists = existsSync(abs);
        const existing = exists ? readFileSync(abs) : null;
        const isText = !incoming.includes(0);
        return { rel, exists, same: exists && existing.equals(incoming), existing: exists && isText ? existing.toString('utf8') : '', incoming: isText ? incoming.toString('utf8') : '', binary: !isText };
      });
    }
  } else plan.install = deps.length ? `npm install ${deps.join(' ')}` : '';

  // usage snippet: the exported component name from the entry file, with the demo props the gallery uses
  const entrySrc = entry && files.includes(entry) ? text(entry) : '';
  const comp = entrySrc.match(/export\s+default\s+(?:function|class|const)?\s*([A-Z]\w*)/)?.[1] ?? entrySrc.match(/export\s+(?:function|const|class)\s+([A-Z]\w*)/)?.[1] ?? 'Component';
  const isDefault = /export\s+default/.test(entrySrc);
  const spec = (alias ? `${alias}/${folder}/` : `@/components/${folder}/`) + entry.replace(/\.(tsx|jsx|ts|js)$/, '');
  const attrs = Object.entries(props).filter(([k]) => !k.startsWith('_')).map(([k, val]) => (typeof val === 'string' ? ` ${k}=${JSON.stringify(val)}` : ` ${k}={${JSON.stringify(val)}}`)).join('');
  const tag = `<${comp}${attrs} />`;
  plan.usage = `${isDefault ? `import ${comp} from '${spec}'` : `import { ${comp} } from '${spec}'`}\n\nexport function Demo() {\n  return ${tag}\n}\n`;
  plan.title = title;
  plan.source = `${source}/${key}`;
  plan.variantPath = v;
  plan.prompt = installPrompt(plan, entry);
  return plan;
}

function installPrompt(p, entry) {
  return [
    `Install the local component variant "${p.name}" (of ${p.source}) into this project.`,
    '',
    `Variant folder: ${p.variantPath}`,
    `- Source files are in ${join(p.variantPath, 'files')} (entry: ${entry || 'see folder'}).`,
    '',
    'Do this:',
    "1. Read components.json (shadcn aliases) and the project's conventions, then copy the files into the matching components folder. Rewrite imports to the project's aliases if they differ.",
    p.shadcn.length ? `2. shadcn components it uses: ${p.shadcn.join(', ')}. Add the missing ones with \`npx shadcn@latest add ${p.shadcn.join(' ')}\`.` : '2. It uses no shadcn components beyond utils.',
    p.deps.length ? `3. npm dependencies: ${p.deps.join(', ')}. Tell me the install command (\`${lockCmd(p.project || '.', p.deps)}\`) and wait for me to run it; do not install anything yourself.` : '3. No extra npm dependencies.',
    '4. If a destination file already exists, show me a diff and ask before overwriting.',
    '5. Show a minimal usage example:',
    '',
    p.usage.trimEnd().replace(/^/gm, '    '),
    p.source.includes('react-bits') ? 'Licence note: React Bits is MIT + Commons Clause. Keep this modified source out of any public repo.' : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

function exportWrite(body) {
  const plan = exportPlan(body);
  if (!plan.dest) throw new Error('no destination');
  const base = resolve(plan.project, plan.dest);
  const allow = new Set(body.overwrite ?? []);
  const out = { written: [], kept: [], same: [] };
  const v = saved(body.source, body.key, plan.name);
  for (const f of plan.files) {
    const abs = inside(base, f.rel);
    if (f.same) out.same.push(f.rel);
    else if (f.exists && !allow.has(f.rel)) out.kept.push(f.rel); // never overwritten without an explicit yes for that file
    else {
      mkdirSync(dirname(abs), { recursive: true });
      copyFileSync(join(v, 'files', f.rel), abs);
      out.written.push(f.rel);
    }
  }
  return { ...out, plan: exportPlan(body) };
}

// ---------- http ----------
export function handle(req, res, body) {
  const u = new URL(req.url, 'http://x');
  const q = Object.fromEntries(u.searchParams);
  if (req.method === 'GET') {
    if (u.pathname === '/list') return list(q.source, q.key);
    if (u.pathname === '/files') return snapshot(q.source, q.key, q.slot);
    if (u.pathname === '/settings') return readSettings();
    throw new Error('unknown route');
  }
  const b = JSON.parse(body || '{}');
  switch (b.op) {
    case 'draft': // start (or restart) a draft from the original
      ensureWork(b.source, b.key, DRAFT, !!b.fresh);
      return list(b.source, b.key);
    case 'file': {
      const w = join(ensureWork(b.source, b.key, slotOf(b.slot)), 'files');
      const abs = inside(w, b.path);
      if (!existsSync(abs) || !EDITABLE.test(b.path) || typeof b.content !== 'string') throw new Error('not an editable file');
      writeFileSync(abs, b.content);
      return { dirty: isDirty(b.source, b.key, slotOf(b.slot)) };
    }
    case 'discard': // drop unsaved changes: draft is deleted, a variant goes back to its saved state
      rmSync(work(b.source, b.key, b.slot), { recursive: true, force: true });
      return list(b.source, b.key);
    case 'save':
      return save(b);
    case 'rename':
      return rename(b);
    case 'duplicate':
      return duplicate(b);
    case 'delete':
      return remove(b);
    case 'note': {
      const d = saved(b.source, b.key, b.name);
      const meta = readJson(join(d, 'meta.json'), {});
      writeAtomic(join(d, 'meta.json'), JSON.stringify({ ...meta, note: String(b.note ?? '') }, null, 2) + '\n');
      return list(b.source, b.key);
    }
    case 'project':
      return setProject(b.project);
    case 'plan':
      return exportPlan(b);
    case 'write':
      return exportWrite(b);
    default:
      throw new Error('unknown op');
  }
}
