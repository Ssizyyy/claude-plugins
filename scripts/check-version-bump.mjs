// Fails if a plugin's files changed since <base> but its .claude-plugin/plugin.json version did not.
// Installs only update when the version changes. CHANGELOG.md-only edits are exempt.
// Node 18+ and git, no dependencies. Usage: node scripts/check-version-bump.mjs <base-ref>
import { execFileSync } from 'node:child_process';

const base = process.argv[2];
if (!base) {
  console.error('usage: node scripts/check-version-bump.mjs <base-ref>');
  process.exit(1);
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const mergeBase = git('merge-base', base, 'HEAD').trim();
const changed = git('diff', '--name-only', mergeBase, 'HEAD', '--', 'plugins/').split('\n').filter(Boolean);

const plugins = new Set(changed.filter((f) => !f.endsWith('/CHANGELOG.md')).map((f) => f.split('/')[1]));
const version = (ref, name) => {
  try {
    return JSON.parse(git('show', `${ref}:plugins/${name}/.claude-plugin/plugin.json`)).version;
  } catch {
    return undefined; // new plugin
  }
};

let bad = 0;
for (const name of plugins) {
  const before = version(mergeBase, name);
  const after = version('HEAD', name);
  if (before !== undefined && before === after) {
    bad++;
    console.error(`${name}: files changed but version is still ${after}. Bump plugins/${name}/.claude-plugin/plugin.json and add a CHANGELOG entry.`);
  } else console.log(`${name}: ${before ?? '(new)'} -> ${after}`);
}
if (!plugins.size) console.log('no plugin changes');
process.exit(bad ? 1 : 0);
