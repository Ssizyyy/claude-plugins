// Merges /gallery-rank batch files into ranking.json (an array of { id, score, scores, reason, blank }).
// Usage: node scripts/rank-merge.mjs <batch.json ...>
// Each batch file is a JSON array of { id, scores: { appFit, a11y, depCost, polish, unique }, reason, blank }.
// score is computed here as the mean of the five scores (1 decimal); a blank render caps it at 2. Entries replace
// older ones with the same id. Invalid entries are reported and skipped.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'ranking.json');
const byId = new Map((existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []).map((r) => [r.id, r]));
const KEYS = ['appFit', 'a11y', 'depCost', 'polish', 'unique'];
let added = 0;
for (const f of process.argv.slice(2)) {
  for (const e of JSON.parse(readFileSync(f, 'utf8'))) {
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
    });
    added++;
  }
}
writeFileSync(file, JSON.stringify([...byId.values()].sort((a, b) => a.id.localeCompare(b.id)), null, 1) + '\n');
console.log(`merged ${added} entries, ranking.json now has ${byId.size}`);
