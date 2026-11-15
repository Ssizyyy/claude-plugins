import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handle as variantsApi } from './variants.mjs'
import { backupCount, dataDir, lastMigration, migrate, picksFile, rankingFile, readJson as readData, writeData } from './data.mjs'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const catalogPath = here('../../plugins/design-stack/skills/ui-component-catalog/catalog/components.json')
const statusPath = here('./src/items/_status.json')

const readJson = (p: string, fallback: unknown) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback)
const categoriesPath = here('./categories.json')
const GROUPS = ['tone', 'roles', 'styles']
const PICK_STATUSES = ['adopted', 'candidate', 'rejected', 'deleted']

// Runs fn on a POST body (or with '' on GET) and sends its result as JSON; a throw becomes a 400.
function readBody(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, fn: (body: string) => unknown) {
  let body = ''
  const done = () => {
    try {
      res.end(JSON.stringify(fn(req.method === 'POST' ? body : '')))
    } catch (e) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: String(e) }))
    }
  }
  if (req.method === 'POST') req.on('data', (c) => (body += c)).on('end', done)
  else done()
}

// Dev-only endpoints. The page never touches plugin files: picks go to the shared data dir (data.mjs), never into the repo.
function galleryApi(): Plugin {
  return {
    name: 'gallery-api',
    configureServer(server) {
      migrate()
      server.middlewares.use('/api/items', (_req, res) => {
        const catalog: { id: string }[] = readJson(catalogPath, { items: [] }).items
        const status = readJson(statusPath, {})
        const items = catalog.map((it) => ({ ...it, fetch: status[it.id] ?? { error: 'not fetched: run npm run gallery:fetch' } }))
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(items))
      })
      // /gallery-rank output: an array of { id, score, scores, reason, blank }
      server.middlewares.use('/api/ranking', (_req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(readData(rankingFile, [])))
      })
      // Where the user's picks live, and what the one-time import of the old in-repo files did at startup.
      server.middlewares.use('/api/data', (_req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ dir: dataDir, picks: picksFile, backups: backupCount(), migration: lastMigration() }))
      })
      // Category definitions (groups tone/roles/styles, each an ordered list of values): the manager screen replaces the whole file.
      server.middlewares.use('/api/categories', (req, res) => {
        res.setHeader('content-type', 'application/json')
        readBody(req, res, (body) => {
          if (body) {
            const doc = JSON.parse(body)
            const ok = Array.isArray(doc.groups) && GROUPS.every((g) => doc.groups.some((x: { id: string; values: unknown[] }) => x.id === g && Array.isArray(x.values)))
            if (!ok) throw new Error('bad categories')
            writeFileSync(categoriesPath, JSON.stringify(doc, null, 2) + '\n')
          }
          return readJson(categoriesPath, { groups: [] })
        })
      })
      // Variants, working copies and exports (variants.mjs). Errors become a 400 with the message.
      server.middlewares.use('/api/v', (req, res) => {
        res.setHeader('content-type', 'application/json')
        let body = ''
        const done = () => {
          try {
            res.end(JSON.stringify(variantsApi(req, res, body)))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
          }
        }
        if (req.method === 'POST') req.on('data', (c) => (body += c)).on('end', done)
        else done()
      })
      // One pick patch for one id or many (bulk): { id | ids, status?, note?, tone?, roles?, styles?, add?: { roles?, styles? } }.
      // The file is read inside the handler so concurrent requests cannot overwrite each other.
      server.middlewares.use('/api/picks', (req, res) => {
        res.setHeader('content-type', 'application/json')
        readBody(req, res, (body) => {
          const file = readData<{ picks: Record<string, any> }>(picksFile, { picks: {} })
          if (!body) return file
          const p = JSON.parse(body)
          const ids: unknown[] = p.ids ?? [p.id]
          if (!ids.length || ids.some((i) => typeof i !== 'string') || (p.status != null && !PICK_STATUSES.includes(p.status))) throw new Error('bad pick')
          for (const id of ids as string[]) {
            const next = { ...(file.picks[id] ?? {}) }
            if (p.status !== undefined) next.status = p.status ?? undefined
            if (p.note !== undefined) next.note = p.note || undefined
            if (p.preferredVariant !== undefined) next.preferredVariant = p.preferredVariant || undefined
            if (p.tone !== undefined) next.tone = p.tone || undefined
            for (const g of ['roles', 'styles']) {
              if (Array.isArray(p[g])) next[g] = p[g]
              if (Array.isArray(p.add?.[g])) next[g] = [...new Set([...(next[g] ?? []), ...p.add[g]])]
              if (!next[g]?.length) delete next[g]
            }
            if (next.status === 'deleted') next.reason = next.note ?? 'no reason given'
            else delete next.reason
            if (next.status || next.note || next.tone || next.roles || next.styles || next.preferredVariant) file.picks[id] = { ...next, at: new Date().toISOString() }
            else delete file.picks[id]
          }
          writeData(picksFile, file)
          return file
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), galleryApi()],
  // next/* and @repo/shadcn: stand-ins for items copied out of Next or monorepo apps
  resolve: { alias: { '@': here('./src'), 'next/image': here('./src/shims/next-image.tsx'), 'next/link': here('./src/shims/next-link.tsx'), '@repo/shadcn': here('./src/shims/repo-shadcn.ts') } },
  // third-party previews that fail to compile must not cover the gallery with an overlay
  // Items are found by glob, not imported statically, so Vite would discover their packages one by one at runtime and
  // reload the page each time, leaving previews stuck on "loading". Scan the items up front and pre-bundle the heavy ones.
  optimizeDeps: {
    entries: ['index.html', 'src/items/**/*.{tsx,jsx}', 'src/work/**/*.{tsx,jsx}'],
    include: ['three', 'three/examples/jsm/environments/RoomEnvironment.js', 'gsap', 'gsap/ScrollTrigger', '@gsap/react', 'ogl', 'motion/react', 'framer-motion', '@hugeicons/react', '@hugeicons/core-free-icons', '@number-flow/react', 'lucide-react', 'radix-ui'],
  },
  server: { hmr: { overlay: false }, fs: { allow: ['..'] } },
})
