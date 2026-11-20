---
name: gallery-fix
description: Repair the UI gallery components the user reported as not loading, re-render them, and mark each report fixed or won't render. Use for /gallery-fix [<item id> ...] [--limit N].
disable-model-invocation: true
---

# Gallery fix

Works through the **open reports** the user filed with the gallery's Report button. Project skill, not shipped with the plugin. It runs only when the user calls it, never on its own.

Arguments: item ids to restrict to (default: every item with an open report), `--limit N`.

Run from the repo root; the gallery lives in `sandbox/gallery`. Never touch `plugins/`, `picks.json` or `ranking.json`. Reports live in `<data dir>/reports.json` (`~/.claude/ui-gallery/`, or `UI_GALLERY_DATA_DIR`); they are only changed through the gallery's `/api/reports`, which backs the file up first.

## Steps

1. **Server.** The gallery must be running with its items fetched (`src/items/_status.json`). If no server answers, start one with `preview_start` (`gallery`, or `gallery-alt` if 5174 is taken) and note its port. Never kill an existing server.
2. **Read.** `GET http://localhost:<port>/api/reports`; keep entries with `status: "open"`, grouped by `itemId` (the latest entry first; older ones are history). Tell the user the count before starting. Nothing open: say so and stop.
3. **Repair**, one Sonnet sub-agent per item (`model: sonnet`, fresh context, up to 3 at a time, no batching by cause). Give each agent the item's open reports (symptom, note, `errors`, `width`, `stage`) and this job, in order of preference:
   - **Props.** Probe the item (step 4's command); if blank or throwing on undefined props, add a `demo-props.json` entry with the logic of `scripts/demo-guess.mjs` (run it on the probe output; it never changes an existing entry, so edit an existing one by hand).
   - **Imports and shims.** A missing module, a path alias, a `next/*` or monorepo import: fix the import in `src/items/<source>/<key>/` or add a shim in `src/shims/`. Installing packages is out of scope: do not run `npm install`.
   - **Re-fetch.** `node scripts/fetch.mjs --force` for that item when the source on disk looks truncated or stale.
   - Never edit anything outside `src/items/`, `src/shims/`, `demo-props.json`. Fetched source is third-party and gitignored: never copy it into a commit.
4. **Re-render.** `node scripts/shots.mjs --port <port> --probe <ids...>` (one JSON line per item: `rendered`, `blank`, `error`, `timeout`). Rendered on both stages counts as fixed. After a fresh fetch or a new item file, restart nothing: ask the user to restart the dev server instead.
5. **Close.** `POST /api/reports` with `{ "action": "fix", "itemId": "<id>", "resolution": "<one line: what changed>" }` for a fixed item. For an item that cannot be repaired, add `"status": "wontrender"` and a `resolution` that gives the reason (the probe error and why it cannot be fixed here, e.g. needs a provider or a package that is not installed).
6. **Report** to the user: items fixed, items marked won't render with the reason each, items left open (and why), and the files changed. Do not commit.
