// Mechanical half of a skill trial (the judging half is .claude/skills/skill-trial). Node 18+, git, npm.
// Usage: node scripts/skill-trial.mjs <command>
//   fetch <owner/repo> [path] [--name n] [--commit sha]   pin a candidate into trials/candidates/<name>, print the pre-read list
//   setup <name> [A,B]                                     one worktree per variant; every variant but A gets the candidate
//   metrics <name>                                         build each variant, write metrics.json (build, bundle, diff, deps)
//   judge <name> <screen,screen,...>                       build the blind side-by-side page under trials/<dir>/judge
//   serve [port]                                           static server for trials/ (default 4700)
//   cleanup <name>                                         remove the worktrees, branches, judge build and candidate copy
import { execFileSync, execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const trials = join(root, 'trials');
const candidates = join(trials, 'candidates');
const pluginSkills = 'plugins/design-stack/skills';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const sh = (cwd, cmd) => execSync(cmd, { cwd, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const die = (msg) => { console.error(msg); process.exit(1); };
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const state = (name) => existsSync(join(candidates, `${name}.json`)) ? readJson(join(candidates, `${name}.json`)) : die(`no trial state for ${name}: run fetch or setup first`);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

// Lines a human must read before anything from the candidate runs.
const RISKY = /curl |wget |npx |npm i|pip install|rm -rf|\.claude[\\/]|settings\.json|\.env\b|base64|eval\(|child_process|allowed-tools|hooks?:|https?:\/\//i;
const DOCS = new Set(['.md', '.txt', '.json', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '']);

function fetchCandidate(repo, args) {
  const opt = (k) => { const i = args.indexOf(k); return i < 0 ? undefined : args.splice(i, 2)[1]; };
  let name = opt('--name');
  const pinned = opt('--commit');
  let [path] = args;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) die('usage: fetch <owner/repo> [path] [--name n] [--commit sha]');
  const url = `https://github.com/${repo}`;
  const commit = pinned ?? git(root, 'ls-remote', url, 'HEAD').split('\t')[0];
  if (!commit) die(`cannot resolve HEAD of ${url}`);
  const cache = join(tmpdir(), 'claude-plugins-upstream', repo.replace('/', '_') + '.git');
  const c = (...a) => git(root, `--git-dir=${cache}`, ...a);
  if (!existsSync(join(cache, 'HEAD'))) git(root, 'init', '-q', '--bare', cache);
  try { c('cat-file', '-e', `${commit}^{tree}`); } catch { c('fetch', '-q', '--depth', '1', url, commit); }
  const all = c('ls-tree', '-r', '--name-only', '-z', commit).split('\0').filter(Boolean);
  if (path === undefined) {
    const skills = all.filter((f) => /(^|\/)SKILL\.md$/.test(f)).map((f) => dirname(f));
    if (skills.length !== 1) die(`${skills.length} skills in ${repo}; pass one path:\n  ${skills.join('\n  ')}`);
    [path] = skills;
  }
  path = path.replace(/\/$/, '');
  const files = path === '.' ? all : all.filter((f) => f.startsWith(path + '/'));
  if (!files.some((f) => f.endsWith('SKILL.md'))) die(`no SKILL.md under ${path} at ${commit.slice(0, 12)}`);
  name ??= path === '.' ? repo.split('/')[1] : path.split('/').pop();
  const dest = join(candidates, name);
  rmSync(dest, { recursive: true, force: true });
  for (const f of files) {
    const out = join(dest, path === '.' ? f : f.slice(path.length + 1));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, execFileSync('git', [`--git-dir=${cache}`, 'cat-file', 'blob', `${commit}:${f}`], { maxBuffer: 256 * 1024 * 1024 }));
  }
  writeJson(join(candidates, `${name}.json`), { name, repo, path, commit });

  console.log(`${name}: ${repo}@${commit.slice(0, 12)} ${path} -> trials/candidates/${name} (${files.length} files)`);
  const log = join(trials, 'LOG.md');
  const seen = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((l) => l.includes(repo) && l.includes(`| ${name} |`)) : [];
  if (seen.length) console.log(`\nALREADY LOGGED (retest only if the commit differs from ${commit.slice(0, 12)}):\n${seen.join('\n')}`);
  if (existsSync(join(root, pluginSkills, name))) console.log(`\nNAME COLLISION: ${pluginSkills}/${name} exists; refetch with --name`);
  console.log('\nPRE-READ. Not docs (read in full before anything runs):');
  const code = walk(dest).filter((f) => !DOCS.has(extname(f).toLowerCase()));
  console.log(code.length ? code.map((f) => `  ${f.slice(root.length + 1)}`).join('\n') : '  none');
  console.log('\nPRE-READ. Lines that install, fetch, touch config or name a URL:');
  for (const f of walk(dest)) {
    if (statSync(f).size > 2e6 || /\.(png|jpe?g|webp|gif|woff2?)$/i.test(f)) continue;
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => RISKY.test(l) && console.log(`  ${f.slice(root.length + 1)}:${i + 1}: ${l.trim().slice(0, 160)}`));
  }
}

function setup(name, list = 'A,B') {
  const file = join(candidates, `${name}.json`);
  const s = existsSync(file) ? readJson(file) : { name }; // no fetch: the candidate already ships in the plugin (dry runs)
  if (s.variants) die(`${name} is already set up; run cleanup ${name} first`);
  const date = new Date().toLocaleDateString('sv');
  Object.assign(s, { date, dir: `trials/${date}-${name}`, base: git(root, 'rev-parse', 'HEAD').trim(), variants: {} });
  mkdirSync(join(root, s.dir), { recursive: true });
  for (const v of ['before', ...list.split(',')]) { // 'before' is never run: it is the untouched base for the bundle delta and the judge page
    const path = join(root, '.claude', 'worktrees', `trial-${name}-${v}`);
    const branch = `trial/${name}-${v}`;
    git(root, 'worktree', 'add', '-q', '-b', branch, path, 'HEAD');
    rmSync(join(path, 'trials'), { recursive: true, force: true }); // variants must not see the slop manifest or old reports
    if (v !== 'A' && v !== 'before' && existsSync(join(candidates, name))) cpSync(join(candidates, name), join(path, pluginSkills, name), { recursive: true });
    git(path, 'add', '-A');
    git(path, 'commit', '-q', '--allow-empty', '-m', `trial setup: ${name} variant ${v}`);
    console.log(`${v}: npm ci in ${path} ...`);
    sh(join(path, 'sandbox'), 'npm ci --prefer-offline --no-audit --no-fund');
    const made = { path, branch, setup: git(path, 'rev-parse', 'HEAD').trim() };
    if (v === 'before') s.before = made; else s.variants[v] = made;
  }
  mkdirSync(candidates, { recursive: true });
  writeJson(file, s);
  console.log(`\n${s.dir}\n` + Object.entries(s.variants).map(([v, x]) => `${v}: ${x.path}  (${x.branch})`).join('\n'));
}

const assetBytes = (dist) => {
  const out = { js: 0, css: 0, jsGzip: 0, cssGzip: 0 };
  for (const f of existsSync(join(dist, 'assets')) ? walk(join(dist, 'assets')) : []) {
    const k = extname(f).slice(1);
    if (k !== 'js' && k !== 'css') continue;
    const buf = readFileSync(f);
    out[k] += buf.length;
    out[k + 'Gzip'] += gzipSync(buf).length;
  }
  return out;
};

function measure(dir, setupCommit) {
  const sandbox = join(dir, 'sandbox');
  const m = { build: 'pass' };
  try { sh(sandbox, 'npm run build'); } catch (e) { m.build = 'FAIL'; m.buildOutput = `${e.stdout}${e.stderr}`.trim().split('\n').slice(-15).join('\n'); }
  Object.assign(m, assetBytes(join(sandbox, 'dist')));
  if (setupCommit) {
    m.commits = git(dir, 'log', '--reverse', '--format=%h %s', `${setupCommit}..HEAD`).trim().split('\n').filter(Boolean);
    m.diff = git(dir, 'diff', '--shortstat', setupCommit, '--', 'sandbox').trim();
    m.uncommitted = git(dir, 'status', '--porcelain').trim().split('\n').filter(Boolean).length;
    const deps = (text) => { const p = JSON.parse(text); return { ...p.dependencies, ...p.devDependencies }; };
    const before = deps(git(dir, 'show', `${setupCommit}:sandbox/package.json`));
    m.newPackages = Object.keys(deps(readFileSync(join(sandbox, 'package.json'), 'utf8'))).filter((k) => !(k in before));
  }
  return m;
}

function metrics(name) {
  const s = state(name);
  const out = { before: measure(s.before.path) };
  for (const [v, x] of Object.entries(s.variants)) out[v] = measure(x.path, x.setup);
  writeJson(join(root, s.dir, 'metrics.json'), out);
  const kb = (n) => (n / 1024).toFixed(1);
  for (const [v, m] of Object.entries(out)) {
    const d = v === 'before' ? '' : `  (${m.jsGzip >= out.before.jsGzip ? '+' : ''}${kb(m.jsGzip - out.before.jsGzip)} kB js gzip vs before)`;
    console.log(`${v}: build ${m.build}, js ${kb(m.js)} kB (${kb(m.jsGzip)} gzip), css ${kb(m.css)} kB${d}`);
    if (m.commits) console.log(`   ${m.commits.length} commits, ${m.diff || 'no diff'}, ${m.uncommitted} uncommitted, new packages: ${m.newPackages.join(', ') || 'none'}`);
    if (m.buildOutput) console.log(m.buildOutput);
  }
  console.log(`\nwrote ${s.dir}/metrics.json`);
}

// Blind page: each variant is built into a folder with a random id, and every screen gets its own
// X/Y shuffle, so neither the URL nor the position says which variant it is. key.json holds the answer.
function judge(name, screenList) {
  const s = state(name);
  const screens = (screenList ?? '').split(',').filter(Boolean);
  if (!screens.length) die('usage: judge <name> <screen,screen,...>   (hash routes, e.g. orders,settings,login; add @390 for a phone-width screen)');
  const out = join(root, s.dir, 'judge');
  rmSync(out, { recursive: true, force: true });
  const build = (dir, id) => sh(join(dir, 'sandbox'), `npx vite build --base ./ --outDir "${join(out, id)}" --emptyOutDir`);
  build(s.before.path, 'before');
  const ids = {};
  for (const [v, x] of Object.entries(s.variants)) { ids[v] = randomBytes(4).toString('hex'); build(x.path, ids[v]); }
  const labels = 'XYZWVU'.split('');
  const key = {};
  const rows = screens.map((spec) => {
    const [screen, width = '1280'] = spec.split('@');
    const order = Object.keys(ids).sort(() => Math.random() - 0.5);
    key[screen] = Object.fromEntries(order.map((v, i) => [labels[i], v]));
    return { screen, width: Number(width), cols: [{ label: 'Before', id: 'before' }, ...order.map((v, i) => ({ label: labels[i], id: ids[v] }))] };
  });
  writeJson(join(out, 'key.json'), key);
  writeFileSync(join(out, 'index.html'), page(name, rows));
  console.log(`built ${s.dir}/judge. Serve with: node scripts/skill-trial.mjs serve, then open http://localhost:4700/${s.dir.slice(7)}/judge/`);
}

const page = (name, rows) => `<!doctype html><meta charset="utf-8"><title>Trial: ${name}</title>
<style>
  body{font:14px system-ui;margin:16px;background:#f4f4f5;color:#18181b}
  h2{margin:28px 0 8px} .bar{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap}
  .row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px} .col{flex:none} .col b{display:inline-block;margin:0 8px 4px 0}
  .frame{border:1px solid #d4d4d8;background:#fff;overflow:hidden} iframe{border:0;transform-origin:0 0}
  button,label{font:inherit;padding:4px 10px;border:1px solid #d4d4d8;border-radius:6px;background:#fff;cursor:pointer}
  button.on{background:#18181b;color:#fff} pre{background:#fff;border:1px solid #d4d4d8;padding:12px;white-space:pre-wrap}
</style>
<h1>Trial: ${name}</h1>
<p>Each screen has its own shuffle: X on one screen is not X on the next. Pick a winner per screen, then copy the result into the chat. Reveal only after you have picked.</p>
<div class="bar">State: ${['', 'empty=1', 'fail=1', 'latency=4000'].map((q, i) => `<button class="state${i ? '' : ' on'}" data-q="${q}">${q || 'default'}</button>`).join(' ')}
 Zoom: <input id="zoom" type="range" min="30" max="100" value="45"></div>
${rows.map((r) => `<h2>${r.screen}</h2>
<div class="bar">Winner: ${[...r.cols.slice(1).map((c) => c.label), 'tie'].map((l) => `<label><input type="radio" name="${r.screen}" value="${l}"> ${l}</label>`).join(' ')}</div>
<div class="row">${r.cols.map((c) => `<div class="col"><b>${c.label}</b><a target="_blank" data-base="${c.id}/index.html#/${r.screen}">open live</a>
<div class="frame" data-w="${r.width}"><iframe data-base="${c.id}/index.html#/${r.screen}" width="${r.width}" height="900"></iframe></div></div>`).join('')}</div>`).join('\n')}
<h2>Result</h2><pre id="result">pick a winner for every screen</pre>
<button id="reveal">Reveal which variant was which</button>
<script>
  let q = '';
  const $ = (s) => [...document.querySelectorAll(s)];
  const load = () => { $('[data-base]').forEach((e) => { const u = e.dataset.base + (q ? '?' + q : ''); e.tagName === 'A' ? e.href = u : e.src = u; }); };
  const zoom = () => { const z = document.getElementById('zoom').value / 100; $('.frame').forEach((f) => { const w = +f.dataset.w; f.style.width = w * z + 'px'; f.style.height = 900 * z + 'px'; f.firstChild.style.transform = 'scale(' + z + ')'; }); };
  const result = (key) => { document.getElementById('result').textContent = ${JSON.stringify(rows.map((r) => r.screen))}.map((s) => { const p = document.querySelector('input[name="' + s + '"]:checked')?.value; return s + ': ' + (p ?? '?') + (key && p && p !== 'tie' ? ' = variant ' + key[s][p] : ''); }).join('\\n'); };
  $('.state').forEach((b) => b.onclick = () => { $('.state').forEach((x) => x.classList.toggle('on', x === b)); q = b.dataset.q; load(); });
  document.getElementById('zoom').oninput = zoom; $('input[type=radio]').forEach((r) => r.onchange = () => result());
  document.getElementById('reveal').onclick = async () => result(await (await fetch('key.json')).json());
  load(); zoom();
</script>`;

function serve(port = 4700) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  createServer((req, res) => {
    let p = normalize(join(trials, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!p.startsWith(trials)) return res.writeHead(403).end();
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) return res.writeHead(404).end('not found');
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(p).pipe(res);
  }).listen(Number(port), '127.0.0.1', () => console.log(`serving trials/ on http://localhost:${port}/`));
}

function cleanup(name) {
  const s = state(name);
  for (const x of [s.before, ...Object.values(s.variants ?? {})].filter(Boolean)) {
    try { git(root, 'worktree', 'remove', '--force', x.path); } catch (e) { console.error(`worktree ${x.path}: ${e.stderr}`); }
    try { git(root, 'branch', '-q', '-D', x.branch); } catch (e) { console.error(`branch ${x.branch}: ${e.stderr}`); }
  }
  if (s.dir) rmSync(join(root, s.dir, 'judge'), { recursive: true, force: true });
  rmSync(join(candidates, name), { recursive: true, force: true });
  rmSync(join(candidates, `${name}.json`), { force: true });
  console.log(`cleaned ${name}; ${s.dir ?? 'no trial dir'} keeps report.md and metrics.json`);
}

const [cmd, a, ...rest] = process.argv.slice(2);
const run = { fetch: () => fetchCandidate(a, rest), setup: () => setup(a, rest[0]), metrics: () => metrics(a), judge: () => judge(a, rest[0]), serve: () => serve(a), cleanup: () => cleanup(a) }[cmd];
if (!run || (cmd !== 'serve' && !a)) die('usage: node scripts/skill-trial.mjs fetch|setup|metrics|judge|serve|cleanup ... (see the header of this file)');
run();
