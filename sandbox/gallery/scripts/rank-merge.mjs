// Merges /gallery-rank batch files into ranking.json (an array of { id, score, scores, reason, blank }).
// Usage: node scripts/rank-merge.mjs <batch.json ...>
// Each batch file is a JSON array of { id, scores: { appFit, a11y, depCost, polish, unique }, reason, blank }.
// score is computed here as the mean of the five scores (1 decimal); a blank render caps it at 2. Entries replace
// older ones with the same id. Invalid entries are reported and skipped.
import { readFileSync } from 'node:fs';
import { migrate, rankingFile, readRanking, writeData } from '../data.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
migrate();
const file = rankingFile; // the shared data dir (data.mjs), not the repo
const byId = new Map(readRanking().map((r) => [r.id, r]));
const KEYS = ['appFit', 'a11y', 'depCost', 'polish', 'unique'];
const cats = JSON.parse(readFileSync(join(root, 'categories.json'), 'utf8')).groups;
const known = (g) => new Set(cats.find((x) => x.id === g).values.map((v) => v.id));
const TONES = known('tone'), ROLES = known('roles');
// suggested: { tone, roles[], reason }; unknown ids are dropped. An entry with only { id, suggested } updates an already ranked item.
const suggestion = (s) => {
  if (!s) return undefined;
  const tone = TONES.has(s.tone) ? s.tone : undefined;
  const roles = (Array.isArray(s.roles) ? s.roles : []).filter((r) => ROLES.has(r));
  return tone || roles.length ? { ...(tone ? { tone } : {}), ...(roles.length ? { roles } : {}), reason: String(s.reason ?? '').replace(/s+/g, ' ').trim().slice(0, 160) } : undefined;
};
let added = 0;
for (const f of process.argv.slice(2)) {
  for (const e of JSON.parse(readFileSync(f, 'utf8'))) {
    if (!e.scores && e.suggested && byId.has(e.id)) {
      byId.set(e.id, { ...byId.get(e.id), suggested: suggestion(e.suggested) });
      added++;
      continue;
    }
    const ok = typeof e.id === 'string' && typeof e.reason === 'string' && e.scores && KEYS.every((k) => Number.isFinite(e.scores[k]) && e.scores[k] >= 1 && e.scores[k] <= 5);
    if (!ok) {
      console.error(`skipped invalid entry: ${JSON.stringify(e).slice(0, 120)}`);
      continue;
    }
    const mean = KEYS.reduce((a, k) => a + e.scores[k], 0) / KEYS.length;
    const blank = !!e.blank;
    byId.set(e.id, {
      id: e.id,
      score: Math.round((blank ? Math.min(mean, 2) : mean) * 10) / 10,
      scores: Object.fromEntries(KEYS.map((k) => [k, e.scores[k]])),
      reason: e.reason.replace(/\s+/g, ' ').trim().slice(0, 200),
      blank,
      ...(suggestion(e.suggested) ? { suggested: suggestion(e.suggested) } : {}),
    });
    added++;
  }
}
writeData(file, [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)));
console.log(`merged ${added} entries, ranking.json now has ${byId.size}`);
