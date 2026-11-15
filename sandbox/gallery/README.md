# UI gallery (proof)

A separate small Vite + React + Tailwind app for browsing the `ui-component-catalog` visually and picking components by hand. It has its own `package.json`; the main `sandbox/` app is untouched (its bundle size is the baseline for skill trials). It reuses the sandbox design tokens (`../src/polished/*.css`) and nothing else. Never shipped.

## Run

```bash
cd sandbox/gallery
npm install
npm run gallery:fetch   # download the proof-set sources (re-run only fetches what is missing; --force refetches)
npm run gallery         # http://localhost:5174
```

Both scripts also work from the repo root. `vite.config.ts` scans `src/items/` and pre-bundles the heavy packages up front; without that Vite discovers them one at a time, reloading the page each time, and previews stay on `loading…`. After a fresh fetch of new items, restart the dev server so the scan sees them.

`?need=<term>` seeds the search box (`design-pass` will link here later).

## What is shown

`proof-set.json` lists the items: the 25 candidate/unreviewed useLayouts items, 56 React Bits candidates, `BlobCursor` (three) and one deliberately unfetchable item. The full 754 comes later.

Each card renders the real component, lazily, inside an error boundary, only while it is near the viewport (many WebGL canvases at once exhaust browser contexts). Items that fail to download or render get a **won't render** tag with the error. Cards show status, key, source, dependency weight (`basic` = shadcn basics only, `extra` = e.g. motion or icons, `heavy` = gsap/ogl/three/matter-js/lenis) and deps.

Each preview sits on a sized stage (about 460 px wide, 24 rem tall). **Previews: auto/light/dark** in the header sets every stage: `auto` is white, except `backgrounds` items (additive WebGL light, invisible on white) get a dark stage. **Bg** on a card flips just that one. Cards show a state: `loading…` (after 15 s `still loading…` with a retry), `renders blank` (nothing visible after load: no text, media, painted box or canvas pixels; WebGL canvases count as content because their pixels can't be sampled between frames; checked for ~12 s since shaders start late), `won't render` plus the error, or nothing when it rendered. Fetch failures and unresolvable imports also show as `won't render`. Animated canvases can flag blank while the browser tab is in the background, because requestAnimationFrame is paused.

## Detail page

The title, preview or **Open** button on a card opens `#/item/<source>/<key>` (links work directly, `?need=` still applies). It shows one live preview filling the page, a width switcher (Mobile 390 / Tablet 768 / Desktop; the preview is a fixed-width box, so CSS media queries still follow the browser window, not that box), the light/dark stage toggle, metadata (source, family, deps, install command, status), Adopt/Candidate/Reject/Delete with note, and fetch details (open when fetching failed). **← Prev / Next →** or the arrow keys follow the grid's current filter and sort; **Esc** or **Back to grid** returns with filters and scroll position kept (the grid stays mounted, hidden). Only the on-screen item renders, so a heavy WebGL item gets the whole stage.

Rendering is a gallery, not a faithful install: items that need props to show anything get them from `demo-props.json` (keyed by catalog id; `_children` becomes simple child divs). Add an entry when a card is blank or throws on undefined props. Registry `css` (keyframes) is written to `src/items/_items.css`; Tailwind config extensions and `registryDependencies` other than the shadcn basics in `src/components/ui/` are not resolved.

## Picks

Each card has **Adopt / Candidate / Reject / Delete** and a note. The Vite dev server writes them to `picks.json` (the page never touches plugin files). Clicking the active button clears it. **Delete** is a permanent tombstone (`status: "deleted"` plus `reason`, taken from the note, which is required): `gallery:fetch` skips tombstoned items and removes their downloaded folder. Deleted items are hidden by default (status chip). **Export picks** downloads the same JSON.

Applying picks to `curated.json`, refreshing and releasing is a separate step.

### What `refresh.mjs` must do later

`scripts/refresh.mjs` rebuilds `components.json` from the registries, so a deleted item would come back as `unreviewed`. When picks are applied it must read the tombstones (from `curated.json`, e.g. `"status": "deleted"`) and drop those ids from `out`, keeping them in a `deleted` list in `curated.json` so the next import skips them too.

## Gitignored, and why

- `src/items/`: downloaded third-party source and `_status.json`. The repo is public and React Bits is MIT + Commons Clause, so its source must never be committed.
- `node_modules/`, `dist/`.

`picks.json` is committed on purpose (it is the output of your review).
