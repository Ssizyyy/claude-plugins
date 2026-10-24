// Fails if any private project name appears in tracked files (or staged files, or one message file).
// Names come from .private-names (gitignored, one per line, # for comments) or the PRIVATE_NAMES env var
// (newline-separated). Matching is case-insensitive at word or camelCase boundaries, so "acmes" doesn't
// hit a name like "acme" but "myAcme", "acme-app" and "ACME" do. Output never prints the names themselves:
// CI logs on a public repo are public. Node 18+, no dependencies.
// Usage: node scripts/check-private-names.mjs [--staged | --file <path>]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listFile = join(root, '.private-names');
const raw = process.env.PRIVATE_NAMES || (existsSync(listFile) ? readFileSync(listFile, 'utf8') : '');
const names = raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
if (!names.length) {
  console.error('check-private-names: no names (create .private-names or set PRIVATE_NAMES)');
  process.exit(process.env.CI ? 1 : 0); // in CI a missing secret must fail, locally just warn
}

const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const res = names.map((n) => new RegExp(esc(n), 'gi'));
const letter = /[A-Za-z]/;
const lower = /[a-z]/;
const upper = /[A-Z]/;

// a hit counts only at a boundary: not inside a longer lowercase word
function hits(text) {
  const found = [];
  res.forEach((re, i) => {
    for (const m of text.matchAll(re)) {
      const prev = text[m.index - 1] || '';
      const next = text[m.index + m[0].length] || '';
      const okBefore = !letter.test(prev) || (lower.test(prev) && upper.test(m[0][0]));
      const okAfter = !letter.test(next) || (upper.test(next) && lower.test(m[0].at(-1)));
      if (okBefore && okAfter) found.push({ i, line: text.slice(0, m.index).split('\n').length });
    }
  });
  return found;
}

const args = process.argv.slice(2);
let files; // [label, text]
if (args[0] === '--file') {
  files = [[args[1], readFileSync(args[1], 'utf8')]];
} else {
  const staged = args[0] === '--staged';
  const list = (staged ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z') : git('ls-files', '-z'))
    .toString().split('\0').filter(Boolean);
  files = list.map((p) => {
    const buf = staged ? git('show', `:${p}`) : existsSync(join(root, p)) ? readFileSync(join(root, p)) : Buffer.alloc(0);
    return [p, buf.includes(0) ? '' : buf.toString('utf8')]; // skip binaries' contents
  });
}

let bad = 0;
for (const [label, text] of files) {
  for (const h of hits(label)) bad++, console.error(`${label}: path contains private name #${h.i + 1}`);
  for (const h of hits(text)) bad++, console.error(`${label}:${h.line}: private name #${h.i + 1}`);
}
if (bad) {
  console.error(`check-private-names: ${bad} hit(s). #N is the Nth name in the list.`);
  process.exit(1);
}
console.log(`check-private-names: ${files.length} file(s) clean`);
