// /api/runs/<id>: the design-pass "Choose components" handoff. Files live in <data dir>/runs/ (see data.mjs):
//   <id>.json (written by design-pass), <id>.selection.json (Done button), <id>.result.json (design-pass, after build),
//   <id>.swaps.json (review screen). The page only ever writes selection and swaps.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataDir } from './data.mjs';

const runsDir = join(dataDir, 'runs');
const READ = ['', '.selection', '.result', '.swaps'];
const WRITE = { selection: '.selection', swaps: '.swaps' };
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

export function runsApi() {
  return {
    name: 'runs-api',
    configureServer(server) {
      server.middlewares.use('/api/runs', (req, res) => {
        res.setHeader('content-type', 'application/json');
        const send = (code, body) => ((res.statusCode = code), res.end(JSON.stringify(body)));
        const [id, kind] = req.url.replace(/^\/|\?.*$/g, '').split('/');
        if (!/^[\w.-]+$/.test(id ?? '') || id.includes('..')) return send(400, { error: 'bad run id' });
        if (req.method !== 'POST') {
          const [run, selection, result, swaps] = READ.map((ext) => readJson(join(runsDir, `${id}${ext}.json`)));
          return run ? send(200, { run, selection, result, swaps }) : send(404, { error: `no run ${id} in ${runsDir}` });
        }
        const ext = WRITE[kind];
        if (!ext) return send(400, { error: 'POST /api/runs/<id>/selection or /swaps' });
        let body = '';
        req.on('data', (c) => (body += c)).on('end', () => {
          try {
            const value = { ...JSON.parse(body), at: new Date().toISOString() };
            mkdirSync(runsDir, { recursive: true });
            const file = join(runsDir, `${id}${ext}.json`);
            writeFileSync(`${file}.tmp`, JSON.stringify(value, null, 2) + '\n');
            renameSync(`${file}.tmp`, file);
            send(200, value);
          } catch (e) {
            send(400, { error: String(e) });
          }
        });
      });
    },
  };
}
