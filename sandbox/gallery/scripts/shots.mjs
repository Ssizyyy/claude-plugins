// Renders gallery items in a headless system Chrome (or Edge) and reports how each one came out; optionally takes
// screenshots of the live preview on the light and dark stage. Uses playwright-core, which downloads no browser.
// Usage: node scripts/shots.mjs [--port 5174] [--out <dir>] [--probe] [--jobs 3] <id ...>
//   --probe   states only, no screenshots (finds blank and won't-render items quickly)
//   --out     where screenshots go (default .rank-shots/, gitignored): <out>/<source>/<key>-light.jpg and -dark.jpg
// Prints one JSON line per item: { id, state: rendered|blank|error|timeout, error?, light?, dark? }.
// The gallery dev server must be running (npm run gallery); ?stage=light|dark forces the preview background.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt);
const port = opt('--port', '5174');
const probe = args.includes('--probe');
const out = opt('--out', join(root, '.rank-shots'));
const jobs = Number(opt('--jobs', 3));
const valueFlags = new Set(['--port', '--out', '--jobs']);
const ids = args.filter((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1]));
if (!ids.length) {
  console.error('usage: node scripts/shots.mjs [--port N] [--probe] [--out dir] <id ...>');
  process.exit(2);
}

const launchArgs = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
let browser;
for (const channel of ['chrome', 'msedge']) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: launchArgs });
    break;
  } catch {
    /* try the next one */
  }
}
if (!browser) throw new Error('no system Chrome or Edge found for playwright-core');

// One item, one stage: wait for the preview to settle (the gallery marks blank only ~3 s after it loaded).
async function visit(ctx, id, stage, shotPath) {
  const page = await ctx.newPage();
  try {
    await page.goto(`http://localhost:${port}/?stage=${stage}#/item/${id}`, { waitUntil: 'domcontentloaded' });
    const box = page.locator('[data-state]').first();
    let state = 'timeout';
    let since = 0;
    for (let t = 0; t < 40; t++) {
      await page.waitForTimeout(500);
      const s = await box.getAttribute('data-state').catch(() => null);
      if (s === 'error') {
        state = 'error';
        break;
      }
      if (s === 'rendered' || s === 'blank') {
        since ||= t;
        state = s;
        if (t - since >= (probe ? 7 : 9)) break; // 4.5 s after load: blank detection has had its say
      } else since = 0;
    }
    const error = state === 'error' ? (await box.innerText()).replace(/^won't render\s*/i, '').slice(0, 300) : undefined;
    if (shotPath) {
      mkdirSync(dirname(shotPath), { recursive: true });
      await box.screenshot({ path: shotPath, type: 'jpeg', quality: 60 });
    }
    return { state, error };
  } finally {
    await page.close();
  }
}

const queue = [...ids];
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 760 }, reducedMotion: 'no-preference' });
  while (queue.length) {
    const id = queue.shift();
    const [source, key] = [id.split('/')[0], id.split('/').slice(1).join('/')];
    try {
      const light = join(out, source, `${key}-light.jpg`);
      const dark = join(out, source, `${key}-dark.jpg`);
      const a = await visit(ctx, id, probe ? 'auto' : 'light', probe ? null : light);
      const entry = { id, state: a.state, ...(a.error ? { error: a.error } : {}) };
      if (!probe && a.state !== 'error') {
        const b = await visit(ctx, id, 'dark', dark);
        if (b.state === 'blank' && a.state === 'rendered') entry.state = 'rendered'; // visible on one stage is enough
        if (a.state === 'blank' && b.state === 'rendered') entry.state = 'rendered';
      }
      if (!probe) Object.assign(entry, { light, ...(a.state !== 'error' ? { dark } : {}) });
      console.log(JSON.stringify(entry));
    } catch (e) {
      console.log(JSON.stringify({ id, state: 'timeout', error: String(e).slice(0, 200) }));
    }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: Math.min(jobs, ids.length) }, worker));
await browser.close();
