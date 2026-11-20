// Where the gallery keeps what the user makes: picks (status, notes, categories) and the /gallery-rank scores.
// They live outside the repo so a new or cleaned-up worktree cannot lose them:
//   <UI_GALLERY_DATA_DIR or ~/.claude/ui-gallery>/picks.json, ranking.json, backups/
// Committed definitions (categories.json, demo-props.json) stay in the repo.
// Shared by vite.config.ts (dev server) and the scripts, so it is plain ESM with no dependencies.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export const dataDir = process.env.UI_GALLERY_DATA_DIR || join(homedir(), '.claude', 'ui-gallery');
export const picksFile = join(dataDir, 'picks.json');
export const rankingFile = join(dataDir, 'ranking.json');
const legacyPicks = join(root, 'picks.json'); // used to be committed here
const legacyRanking = join(root, 'ranking.json'); // still committed as the seed from the proof run
const KEEP = 20;
const BACKUP_GAP_MS = 60_000; // at most one backup a minute, so a burst of clicks cannot push out older ones

export const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};

// Write through a temp file + rename so a crash never leaves half a file; first copy the old file into backups/.
export function writeData(file, value, force = false) {
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) backup(file, force);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
  renameSync(tmp, file);
}

function backup(file, force = false) {
  const dir = join(dirname(file), 'backups');
  const stem = file.replace(/^.*[\\/]/, '').replace(/\.json$/, '');
  mkdirSync(dir, { recursive: true });
  const mine = readdirSync(dir).filter((f) => f.startsWith(`${stem}-`) && f.endsWith('.json')).sort();
  const last = mine.at(-1)?.slice(stem.length + 1, -5).replace(/(T\d\d)-(\d\d)-(\d\d)/, '$1:$2:$3');
  if (!force && last && Date.now() - Date.parse(last) < BACKUP_GAP_MS) return;
  copyFileSync(file, join(dir, `${stem}-${new Date().toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, 'Z')}.json`));
  for (const old of mine.slice(0, Math.max(0, mine.length + 1 - KEEP))) rmSync(join(dir, old));
}

export const backupCount = () => {
  const dir = join(dataDir, 'backups');
  return existsSync(dir) ? readdirSync(dir).length : 0;
};

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const at = (p) => Date.parse(p?.at ?? '') || 0;

// One-time import of the old in-repo files. A legacy file is merged once (its hash is recorded in migrated.json), so an
// entry the user later removes from the shared file is not resurrected on the next start. The shared file is never
// replaced: legacy picks are added by item id, and where both have the same id the newer `at` wins.
// Returns what happened, for the UI: { picks: {from, imported, newer, kept}, ranking: {...} } (empty when nothing ran).
export function migrate() {
  const log = join(dataDir, 'migrated.json');
  const done = readJson(log, { hashes: [] });
  const report = {};
  const step = (name, legacy, shared, empty, merge) => {
    if (!existsSync(legacy)) return;
    const text = readFileSync(legacy, 'utf8');
    const h = sha(text);
    const incoming = JSON.parse(text);
    if (done.hashes.includes(h) || !Object.keys(empty(incoming)).length) return;
    const current = readJson(shared, null);
    const result = merge(current, incoming);
    writeData(shared, result.next);
    done.hashes.push(h);
    report[name] = { from: legacy, ...result.stats };
  };
  step('picks', legacyPicks, picksFile, (d) => d.picks ?? {}, (cur, inc) => {
    const next = { picks: { ...(cur?.picks ?? {}) } };
    const stats = { imported: 0, newer: 0, kept: 0, hadShared: !!cur }
    for (const [id, p] of Object.entries(inc.picks ?? {})) {
      const mine = next.picks[id];
      if (!mine) (next.picks[id] = p), stats.imported++;
      else if (JSON.stringify(mine) !== JSON.stringify(p)) at(p) > at(mine) ? ((next.picks[id] = p), stats.newer++) : stats.kept++;
    }
    return { next, stats };
  });
  step('ranking', legacyRanking, rankingFile, (d) => d, (cur, inc) => {
    const next = [...(cur ?? [])];
    const have = new Set(next.map((r) => r.id));
    const add = inc.filter((r) => !have.has(r.id));
    return { next: [...next, ...add], stats: { imported: add.length, newer: 0, kept: inc.length - add.length, hadShared: !!cur } };
  });
  if (Object.keys(report).length) {
    done.last = report; // kept so the gallery can keep saying what was imported until the user dismisses it
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(log, JSON.stringify(done, null, 2) + '\n');
  }
  return report;
}

export const lastMigration = () => readJson(join(dataDir, 'migrated.json'), {}).last ?? {};

// ---------- category migration ----------
// The Role list was merged from 10 values to 6 and the Style group was dropped. Old picks and ranking suggestions are
// mapped on read; nothing else changes. Role ids the user added themselves are kept as they are.
export const ROLE_MAP = {
  navigation: 'navigation',
  forms: 'forms',
  data: 'data-feedback',
  feedback: 'data-feedback',
  layout: 'layout-overlays',
  overlays: 'layout-overlays',
  'text-effects': 'effects',
  backgrounds: 'effects',
  loaders: 'effects',
  sections: 'sections',
};
const mapRoles = (roles) => [...new Set(roles.map((r) => ROLE_MAP[r] ?? r))];

// Returns the picks file in the current shape and rewrites it (after a forced backup) when it had the old one.
export function readPicks() {
  const file = readJson(picksFile, { picks: {} });
  let changed = false;
  for (const [id, p] of Object.entries(file.picks ?? {})) {
    if (!('styles' in p) && !(p.roles ?? []).some((r) => ROLE_MAP[r] && ROLE_MAP[r] !== r)) continue;
    changed = true;
    const { styles, ...rest } = p;
    if (rest.roles) rest.roles = mapRoles(rest.roles);
    if (rest.status || rest.note || rest.tone || rest.roles?.length || rest.preferredVariant) file.picks[id] = rest;
    else delete file.picks[id]; // it held styles only
  }
  if (changed) writeData(picksFile, file, true);
  return file;
}

export const readRanking = () => readJson(rankingFile, []).map((r) => (r.suggested?.roles ? { ...r, suggested: { ...r.suggested, roles: mapRoles(r.suggested.roles) } } : r));
