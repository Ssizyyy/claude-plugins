# UI gallery

A separate small Vite + React + Tailwind app for browsing the `ui-component-catalog` visually and picking components by hand. It has its own `package.json`; the main `sandbox/` app is untouched (its bundle size is the baseline for skill trials). It reuses the sandbox design tokens (`../src/polished/*.css`) and nothing else. Never shipped.

## Run

```bash
cd sandbox/gallery
npm install
npm run gallery:fetch               # the 82-item proof set (re-run fetches only what is missing; --force refetches)
npm run gallery:fetch -- --all     # all 754 items; add --install to npm-install the packages they ask for
npm run gallery                    # http://localhost:5174 (npm run gallery -- --port N for another port)
```

Both scripts also work from the repo root. `vite.config.ts` scans `src/items/` and pre-bundles the heavy packages up front; without that Vite discovers them one at a time, reloading the page each time, and previews stay on `loading…`. After a fresh fetch of new items, restart the dev server so the scan sees them.

`?need=<term>` seeds the search box (`design-pass` will link here later).

## Fetching

`gallery:fetch` downloads each item's source from its registry (uselayouts, ui-layouts, beui, React Bits) into the gitignored `src/items/`. It is resumable (status is flushed every 25 items; registry JSON is cached in `.fetch-cache/`), runs 4 requests at a time with a 150 ms pause per worker, never fetches tombstoned items, and ends with a summary: fetched, already on disk, skipped tombstoned, failed, with the failures grouped by cause. Items whose imports cannot be resolved (a package that is not installed, a sibling file the registry does not ship, an `@/…` module the gallery lacks) are not written: they show **won't render** with the reason instead of breaking the build. After fetching it runs `vite build` and drops any item whose imports the build rejects (a package lacking a named export, a type imported as a value), repeating until the build passes (`--no-check` skips). `--install` installs the missing packages into this gallery's own `package.json` (never `sandbox/`'s), with `--ignore-scripts`, and retries those items. `next/image`, `next/link` and `@repo/shadcn` are answered by shims in `src/shims/`.

## What is shown

All 754 catalog items, with status tags. By default only **unreviewed** and **candidate** show; the other statuses (used, adopted, rejected, deleted) are chips you switch on. Items not fetched yet show **not fetched**. The grid is windowed (only the rows near the viewport mount), the sidebar lists sources and families with counts, search covers title, key, description, family, catalog notes and your notes, and sort is by name, status or ranking. Every filter, the sort and the preview background are saved in this browser (localStorage); **Reset filters** clears them.

Each card renders the real component, lazily, inside an error boundary, only while it is near the viewport (many WebGL canvases at once exhaust browser contexts). Items that fail to download or render get a **won't render** tag with the error. Cards show status, key, source, dependency weight (`basic` = shadcn basics only, `extra` = e.g. motion or icons, `heavy` = gsap/ogl/three/matter-js/lenis) and deps.

Each preview sits on a sized stage (about 460 px wide, 24 rem tall). **Previews: auto/light/dark** in the header sets every stage: `auto` is white, except `backgrounds` items (additive WebGL light, invisible on white) get a dark stage. **Bg** on a card flips just that one. Cards show a state: `loading…` (after 15 s `still loading…` with a retry), `renders blank` (nothing visible after load: no text, media, painted box or canvas pixels; WebGL canvases count as content because their pixels can't be sampled between frames; checked for ~12 s since shaders start late), `won't render` plus the error, or nothing when it rendered. Fetch failures and unresolvable imports also show as `won't render`. Animated canvases can flag blank while the browser tab is in the background, because requestAnimationFrame is paused.

## Detail page

The title, preview or **Open** button on a card opens `#/item/<source>/<key>` (links work directly, `?need=` still applies). It shows one live preview filling the page, a width switcher (Mobile 390 / Tablet 768 / Desktop; the preview is a fixed-width box, so CSS media queries still follow the browser window, not that box), the light/dark stage toggle, metadata (source, family, deps, install command, status), Adopt/Candidate/Reject/Delete with note, and fetch details (open when fetching failed). **← Prev / Next →** or the arrow keys follow the grid's current filter and sort; **Esc** or **Back to grid** returns with filters and scroll position kept (the grid stays mounted, hidden). Only the on-screen item renders, so a heavy WebGL item gets the whole stage.

Rendering is a gallery, not a faithful install: items that need props to show anything get them from `demo-props.json` (keyed by catalog id; `_children` becomes simple child divs). Add an entry when a card is blank or throws on undefined props. `scripts/demo-guess.mjs <probe.jsonl>` bulk-adds entries for everything a `scripts/shots.mjs --probe` run found blank or failing, by reading each component's required props (arrays become sample rows, strings, numbers, children); it never changes an existing entry. Registry `css` (keyframes) is written to `src/items/_items.css`; Tailwind config extensions and `registryDependencies` other than the shadcn basics in `src/components/ui/` are not resolved.

## Review queue

**Review queue** in the header steps through the unreviewed and candidate items (within the current search and sidebar choice, in the current sort) one at a time on the detail page. Keys: **A** adopt, **C** candidate, **R** reject, **D** delete (puts the cursor in the note; type the reason, Enter confirms), **← →** move, **Esc** leaves. Any decision moves on to the next item. The queue is a snapshot taken when it opens, so decided items don't vanish under you. The same keys work on a normal detail page.

## Ranking (`/gallery-rank`)

`/gallery-rank <family|source|all> [--limit N] [--resume] [--force]` (project skill in `.claude/skills/gallery-rank/`) screenshots each item on a light and a dark stage with the system Chrome or Edge (`scripts/shots.mjs`, via `playwright-core`; no browser is downloaded), has Sonnet sub-agents score it 1 to 5 on app fit, accessibility and reduced motion, dependency cost, visual polish and uniqueness, and writes `ranking.json` (`{id, score, scores, reason, blank}`). Cards and the detail page show the score and reason; the grid sorts by it and filters by **Min score**. **Accept hint** sets a pick from the score (4 or more: Candidate; 2.5 or less or blank: Reject); you can also ignore it. Picks always win and the ranking never writes to `picks.json`. `scripts/shots.mjs --probe <ids>` only reports how each item renders.

## Picks

Each card has **Adopt / Candidate / Reject / Delete** and a note. The Vite dev server writes them to `picks.json` (the page never touches plugin files). Clicking the active button clears it. **Delete** is a permanent tombstone (`status: "deleted"` plus `reason`, taken from the note, which is required): `gallery:fetch` skips tombstoned items and removes their downloaded folder. Deleted items are hidden by default (status chip). **Export picks** downloads the same JSON.

Applying picks to `curated.json`, refreshing and releasing is a separate step.

### What `refresh.mjs` must do later

`scripts/refresh.mjs` rebuilds `components.json` from the registries, so a deleted item would come back as `unreviewed`. When picks are applied it must read the tombstones (from `curated.json`, e.g. `"status": "deleted"`) and drop those ids from `out`, keeping them in a `deleted` list in `curated.json` so the next import skips them too.

## Gitignored, and why

- `src/items/`: downloaded third-party source and `_status.json`. The repo is public and React Bits is MIT + Commons Clause, so its source must never be committed.
- `.fetch-cache/`: cached registry JSON (the same third-party source).
- `.rank-shots/`, `.rank-batches/`: ranking screenshots and scratch batches.
- `node_modules/`, `dist/`.

`picks.json` and `ranking.json` are committed on purpose (your review and the hint output).

## Categories

`categories.json` (committed) holds three groups the user edits on the **Categories** screen (`#/categories`): **Tone** (one per item), **Role** and **Style** (several, style may stay empty). Each value has a stable `id`, a `label` and its place in the list is its order. A Tone value may carry `surface` (`app` or `marketing`, which overrides the item's own surface tag in the Surface filter) and a `rule` (Showpiece / silly: never in Safe mode, Free mode only on request).

- Assignments live in `picks.json` next to status: `tone`, `roles[]`, `styles[]`. The ranking never writes them.
- Removing a value that items still use asks first. Those items keep the id and show it flagged "removed" until unassigned.
- Assign by chip on the detail page, by key in the detail page and review queue (**1-9** set the Tone, press again to clear; A/C/R/D still set the status and advance), or in bulk: tick cards in the grid, then use the bar that appears.
- Filter by any value (several in one group = any of them), or by **Uncategorized** (no Tone and no Role). Counts show per value; filters are saved in localStorage. Export picks includes the category lists.
- `/gallery-rank` also writes `suggested: { tone, roles[], reason }` into `ranking.json`. It shows as a dashed "Suggested" chip with one-click accept, offered only for what the user hasn't assigned.
