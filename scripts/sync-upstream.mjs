// Re-copies third-party skills from their pinned upstream commits (upstream.json), applies the
// front-matter patches and text replacements (upstream.json `replace`), and shows the resulting git diff. Node 18+ and git, no dependencies.
// Usage: node scripts/sync-upstream.mjs sync [skill...]   copy the pinned commits (all skills by default)
//        node scripts/sync-upstream.mjs bump <skill...>   move the pins to upstream HEAD, then sync those
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'upstream.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cacheRoot = join(tmpdir(), 'claude-plugins-upstream');
const NOTE = '# Modified by Ssizyyy/claude-plugins: added disable-model-invocation (invoke by name only; not changed otherwise)';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const url = (repo) => `https://github.com/${repo}`;

// one bare cache per upstream repo; fetch just the pinned commit. Always pass --git-dir so git
// never falls back to a repository that happens to enclose the temp dir.
const cache = (dir, ...args) => git(root, `--git-dir=${dir}`, ...args);
function fetchCommit(repo, commit) {
  const dir = join(cacheRoot, repo.replace('/', '_') + '.git');
  if (!existsSync(join(dir, 'HEAD'))) git(root, 'init', '-q', '--bare', dir);
  try { cache(dir, 'cat-file', '-e', `${commit}^{tree}`); } catch { cache(dir, 'fetch', '-q', '--depth', '1', url(repo), commit); }
  return dir;
}

const blob = (dir, commit, path) => cache(dir, 'cat-file', 'blob', `${commit}:${path}`);

// add missing front-matter keys just before the closing ---, with the standard note
function patchFrontmatter(text, keys) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error('SKILL.md has no front matter');
  const add = Object.entries(keys).filter(([k]) => !new RegExp(`^${k}:`, 'm').test(m[1]));
  if (!add.length) return text;
  const lines = [NOTE, ...add.map(([k, v]) => `${k}: ${v}`)].join('\n');
  return text.replace(m[0], `---\n${m[1]}\n${lines}\n---`);
}

// replace text in every .md file under dir (pins a version in commands the skill tells the agent to run)
function replaceText(dir, pairs) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) replaceText(f, pairs);
    else if (e.name.endsWith('.md')) {
      const t = readFileSync(f, 'utf8');
      const r = Object.entries(pairs).reduce((x, [a, b]) => x.split(a).join(b), t);
      if (r !== t) writeFileSync(f, r);
    }
  }
}

function sync(name) {
  const s = manifest.skills[name];
  if (!s) throw new Error(`unknown skill: ${name} (see upstream.json)`);
  const dir = fetchCommit(s.repo, s.commit);
  const dest = join(root, s.dest);
  rmSync(dest, { recursive: true, force: true });
  const files = cache(dir, 'ls-tree', '-r', '--name-only', '-z', s.commit, '--', `${s.path}/`).toString().split('\0').filter(Boolean);
  for (const f of files) {
    const out = join(dest, f.slice(s.path.length + 1));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, blob(dir, s.commit, f));
  }
  for (const [local, upstream] of Object.entries(s.files || {})) writeFileSync(join(dest, local), blob(dir, s.commit, upstream));
  if (s.frontmatter) {
    const md = join(dest, 'SKILL.md');
    writeFileSync(md, patchFrontmatter(readFileSync(md, 'utf8'), s.frontmatter));
  }
  if (s.replace) replaceText(dest, s.replace);
  console.log(`${name}: ${s.repo}@${s.commit.slice(0, 12)} -> ${s.dest}`);
}

function bump(name) {
  const s = manifest.skills[name];
  if (!s) throw new Error(`unknown skill: ${name} (see upstream.json)`);
  const head = git(root, 'ls-remote', url(s.repo), 'HEAD').toString().split('\t')[0];
  if (head === s.commit) return console.log(`${name}: already at upstream HEAD`);
  console.log(`${name}: ${s.commit.slice(0, 12)} -> ${head.slice(0, 12)}`);
  s.commit = head;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

const [cmd, ...names] = process.argv.slice(2);
if (cmd === 'sync') (names.length ? names : Object.keys(manifest.skills)).forEach(sync);
else if (cmd === 'bump' && names.length) names.forEach((n) => (bump(n), sync(n)));
else {
  console.error('usage: node scripts/sync-upstream.mjs sync [skill...] | bump <skill...>');
  process.exit(1);
}

const dests = (names.length ? names : Object.keys(manifest.skills)).map((n) => manifest.skills[n].dest);
// content diff only: with core.autocrlf, git status flags rewritten files even when nothing changed
const q = (...a) => execFileSync('git', ['-c', 'core.safecrlf=false', ...a], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const changed = q('diff', '--stat', '--', ...dests) + q('ls-files', '--others', '--exclude-standard', '--', ...dests).split('\n').filter(Boolean).map((f) => `new: ${f}\n`).join('');
console.log(changed.trim() || 'no changes: bundled copies match the pinned commits');
console.log('Review with git diff. A change under plugins/ needs a version bump, a CHANGELOG entry and a NOTICES check.');
