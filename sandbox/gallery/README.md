# UI gallery (proof)

A separate small Vite + React + Tailwind app for browsing the `ui-component-catalog` visually and picking components by hand. It has its own `package.json`; the main `sandbox/` app is untouched (its bundle size is the baseline for skill trials). It reuses the sandbox design tokens (`../src/polished/*.css`) and nothing else. Never shipped.

## Run

```bash
cd sandbox/gallery
npm install
npm run gallery:fetch   # download the proof-set sources (re-run only fetches what is missing; --force refetches)
npm run gallery         # http://localhost:5174
```

Both scripts also work from the repo root. The first page load is slow: Vite optimises each heavy dependency (three, gsap, ogl) the first time a preview imports it.

`?need=<term>` seeds the search box (`design-pass` will link here later).

## What is shown

`proof-set.json` lists the items: the 25 candidate/unreviewed useLayouts items, 56 React Bits candidates, `BlobCursor` (three) and one deliberately unfetchable item. The full 754 comes later.

Each card renders the real component, lazily, inside an error boundary, only while it is near the viewport (many WebGL canvases at once exhaust browser contexts). Items that fail to download or render get a **won't render** tag with the error. Cards show status, key, source, dependency weight (`basic` = shadcn basics only, `extra` = e.g. motion or icons, `heavy` = gsap/ogl/three/matter-js/lenis) and deps.

Rendering is a gallery, not a faithful install: previews get no props, so a component that needs props may fail or render empty. Registry `css` (keyframes) is written to `src/items/_items.css`; Tailwind config extensions and `registryDependencies` other than the shadcn basics in `src/components/ui/` are not resolved.

## Picks

Each card has **Adopt / Candidate / Reject / Delete** and a note. The Vite dev server writes them to `picks.json` (the page never touches plugin files). Clicking the active button clears it. **Delete** is a permanent tombstone (`status: "deleted"` plus `reason`, taken from the note, which is required): `gallery:fetch` skips tombstoned items and removes their downloaded folder. Deleted items are hidden by default (status chip). **Export picks** downloads the same JSON.

Applying picks to `curated.json`, refreshing and releasing is a separate step.

### What `refresh.mjs` must do later

`scripts/refresh.mjs` rebuilds `components.json` from the registries, so a deleted item would come back as `unreviewed`. When picks are applied it must read the tombstones (from `curated.json`, e.g. `"status": "deleted"`) and drop those ids from `out`, keeping them in a `deleted` list in `curated.json` so the next import skips them too.

## Gitignored, and why

- `src/items/`: downloaded third-party source and `_status.json`. The repo is public and React Bits is MIT + Commons Clause, so its source must never be committed.
- `node_modules/`, `dist/`.

`picks.json` is committed on purpose (it is the output of your review).
