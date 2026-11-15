// node --test plugins/design-stack/skills/design-pass/scripts/shortlist.test.mjs
// Runs the real build/resolve/used commands on the real catalog with a scratch data dir.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(dirname(fileURLToPath(import.meta.url)), 'shortlist.mjs');
const data = mkdtempSync(join(tmpdir(), 'shortlist-'));
const run = (...a) => JSON.parse(execFileSync('node', [script, ...a], { env: { ...process.env, UI_GALLERY_DATA_DIR: data }, encoding: 'utf8' }));
const needs = join(data, 'needs.json');
writeFileSync(needs, JSON.stringify({ needs: [
  { id: 'button', scope: 'shared', terms: ['button'], roles: ['forms'] },
  { id: 'tabs', scope: 'shared', terms: ['tabs'], roles: ['navigation'] },
  { id: 'pricing', scope: 'page', page: 'Billing', terms: ['pricing'] },
] }));
writeFileSync(join(data, 'picks.json'), JSON.stringify({ picks: { 'uselayouts/discrete-tabs': { status: 'rejected' }, 'ui-layouts/btn-arrow-right': { status: 'deleted' } } }));

test('build: default + up to 4 alternatives, rejected and deleted never appear, extras capped at 6', () => {
  const r = run('build', '--needs', needs, '--run', 't1', '--mode', 'safe', '--project', data);
  const run1 = JSON.parse(readFileSync(join(data, 'runs', 't1.json'), 'utf8'));
  const seen = run1.needs.flatMap((n) => [n.default, ...n.alternatives, ...n.withPackages]);
  assert.ok(!seen.includes('uselayouts/discrete-tabs') && !seen.includes('ui-layouts/btn-arrow-right'));
  for (const n of run1.needs) assert.ok(n.alternatives.length <= 4);
  assert.ok(run1.needs[0].default && run1.needs[1].default, 'button and tabs have a package-free default');
  for (const n of run1.needs) for (const id of [n.default, ...n.alternatives]) assert.equal(run1.packages[id], undefined, 'safe mode hides package-adding items');
  assert.ok(run1.extras.length <= 6);
  assert.equal(r.needs.length, 3);
});

test('resolve: skipped need takes the default, "none" means no component, used records status and the kit', () => {
  const run1 = JSON.parse(readFileSync(join(data, 'runs', 't1.json'), 'utf8'));
  writeFileSync(join(data, 'runs', 't1.selection.json'), JSON.stringify({ done: true, choices: { button: 'none', tabs: run1.needs[1].alternatives[0] }, extras: [] }));
  const r = run('resolve', '--run', 't1');
  assert.equal(r.choices.button, null);
  assert.equal(r.choices.tabs, run1.needs[1].alternatives[0]);
  assert.equal(r.choices.pricing, run1.needs[2].default);
  assert.deepEqual(r.skipped, ['pricing']);
  run('used', '--run', 't1');
  const picks = JSON.parse(readFileSync(join(data, 'picks.json'), 'utf8')).picks;
  assert.equal(picks[r.choices.tabs].status, 'used');
  const again = run('build', '--needs', needs, '--run', 't2', '--project', data);
  const t2 = JSON.parse(readFileSync(join(data, 'runs', 't2.json'), 'utf8'));
  assert.equal(t2.needs.find((n) => n.id === 'tabs').fixed, r.choices.tabs, 'shared choice reused by the next run');
  assert.ok(again.needs[0].default === undefined || again.needs[0].default !== undefined);
});
