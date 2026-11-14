import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const catalogPath = here('../../plugins/design-stack/skills/ui-component-catalog/catalog/components.json')
const picksPath = here('./picks.json')
const statusPath = here('./src/items/_status.json')

const readJson = (p: string, fallback: unknown) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback)
const PICK_STATUSES = ['adopted', 'candidate', 'rejected', 'deleted']

// Dev-only endpoints. The page never touches plugin files: picks go to sandbox/gallery/picks.json.
function galleryApi(): Plugin {
  return {
    name: 'gallery-api',
    configureServer(server) {
      server.middlewares.use('/api/items', (_req, res) => {
        const proof = readJson(here('./proof-set.json'), { ids: [], extras: [] })
        const catalog: { id: string }[] = readJson(catalogPath, { items: [] }).items
        const status = readJson(statusPath, {})
        const items = [...proof.ids.map((id: string) => catalog.find((c) => c.id === id)), ...proof.extras]
          .filter(Boolean)
          .map((it) => ({ ...it, fetch: status[it.id] ?? { error: 'not fetched: run npm run gallery:fetch' } }))
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(items))
      })
      server.middlewares.use('/api/picks', (req, res) => {
        res.setHeader('content-type', 'application/json')
        const file = readJson(picksPath, { picks: {} })
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              const { id, status, note } = JSON.parse(body)
              if (typeof id !== 'string' || (status != null && !PICK_STATUSES.includes(status))) throw new Error('bad pick')
              const next = { ...(file.picks[id] ?? {}) }
              if (status !== undefined) next.status = status ?? undefined
              if (note !== undefined) next.note = note || undefined
              if (next.status === 'deleted') next.reason = next.note ?? 'no reason given'
              else delete next.reason
              if (next.status || next.note) file.picks[id] = { ...next, at: new Date().toISOString() }
              else delete file.picks[id]
              writeFileSync(picksPath, JSON.stringify(file, null, 2) + '\n')
              res.end(JSON.stringify(file))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
        } else res.end(JSON.stringify(file))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), galleryApi()],
  resolve: { alias: { '@': here('./src') } },
  // third-party previews that fail to compile must not cover the gallery with an overlay
  server: { hmr: { overlay: false }, fs: { allow: ['..'] } },
})
