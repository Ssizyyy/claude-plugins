// Regenerates catalog/components.json and catalog/INDEX.md from the public shadcn registries,
// merged with catalog/curated.json (hand-written evaluations). Node 18+, no dependencies.
// Usage: node scripts/refresh.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const curated = JSON.parse(readFileSync(join(root, 'catalog/curated.json'), 'utf8'));

const SOURCES = {
  uselayouts: {
    url: 'https://uselayouts.com/r/registry.json',
    site: 'https://uselayouts.com',
    install: (k) => `bunx --bun shadcn@latest add @uselayouts/${k}`,
    note: 'needs "registries": {"@uselayouts": "https://uselayouts.com/r/{name}.json"} in components.json',
  },
  'ui-layouts': {
    url: 'https://ui-layouts.com/r/registry.json',
    site: 'https://ui-layouts.com',
    install: (k) => `npx shadcn@latest add https://ui-layouts.com/r/${k}.json`,
    note: '',
  },
  beui: {
    url: 'https://beui.dev/r/registry.json',
    site: 'https://beui.dev',
    install: (k) => `npx shadcn@latest add https://beui.dev/r/${k}.json`,
    note: '',
  },
};

const human = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function familyOf(source, item) {
  if (source === 'uselayouts' || source === 'beui') return 'components';
  const p = item.files[0].path.replace(/^\.\//, '');
  if (p.includes('packages/blocks/src/')) return p.split('packages/blocks/src/')[1].split('/')[0]; // e.g. hero-section
  const parts = p.replace(/^registry\//, '').split('/'); // components/<family>/file
  return parts.length > 2 ? parts[1] : 'misc';
}

const out = [];
for (const [source, cfg] of Object.entries(SOURCES)) {
  let reg;
  try {
    const res = await fetch(cfg.url);
    if (!res.ok) throw new Error(`${cfg.url}: ${res.status}`);
    reg = await res.json();
  } catch {
    // some networks time out Node's fetch (IPv6/proxy) while curl works
    reg = JSON.parse(execFileSync('curl', ['-sL', '-m', '60', cfg.url], { maxBuffer: 64 * 1024 * 1024 }).toString());
  }
  for (const it of reg.items) {
    const family = familyOf(source, it);
    const id = `${source}/${it.name}`;
    const cur = { ...(curated.families?.[`${source}/${family}`] || {}), ...(curated.items?.[id] || {}) };
    out.push({
      id,
      source,
      key: it.name,
      title: it.title || human(it.name),
      description: it.description || '',
      type: it.type.replace('registry:', ''),
      family,
      dependencies: [...(it.dependencies || []), ...(it.devDependencies || [])],
      install: cfg.install(it.name),
      ...cur,
      status: cur.status || 'unreviewed',
    });
  }
}

writeFileSync(join(root, 'catalog/components.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: out.length, items: out }, null, 1));

// INDEX.md: one line per family, items listed with status marker. Compact enough to read whole.
const mark = { used: '*', adopted: '+', candidate: '?', rejected: '-', unreviewed: '' };
let md = `# UI component index\n\nGenerated ${new Date().toISOString().slice(0, 10)} by scripts/refresh.mjs. ${out.length} items.\nMarkers: \`*\` used in a shipped design, \`+\` adopted, \`?\` candidate, \`-\` rejected, no marker = unreviewed.\nDetails per key: grep catalog/components.json. Install commands: SKILL.md.\n`;
for (const source of Object.keys(SOURCES)) {
  md += `\n## ${source}\n`;
  const fams = {};
  out.filter((i) => i.source === source).forEach((i) => (fams[i.family] ||= []).push(i));
  for (const [fam, items] of Object.entries(fams).sort()) {
    const label = source === 'uselayouts' || source === 'beui' ? '' : `**${fam}** (${items[0].type}): `;
    md += `- ${label}${items.map((i) => `${i.key}${mark[i.status] ?? ''}`).join(', ')}\n`;
  }
}
writeFileSync(join(root, 'catalog/INDEX.md'), md);
console.log(`wrote ${out.length} items; reviewed: ${out.filter((i) => i.status !== 'unreviewed').length}`);
