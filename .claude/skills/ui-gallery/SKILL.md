---
name: ui-gallery
description: Start the UI component gallery (sandbox/gallery) and open it in the browser pane to browse and pick catalog components by hand. Use for /ui-gallery [term].
disable-model-invocation: true
---

# UI gallery

1. If `sandbox/gallery/node_modules` is missing: `npm install --prefix sandbox/gallery`.
2. If `sandbox/gallery/src/items/_status.json` is missing, or the user asks to refresh: `npm run gallery:fetch` (run from the repo root; downloads third-party sources into the gitignored `src/items/`).
3. Start the server with `preview_start` using the `gallery` entry from `.claude/launch.json` (port 5174). Don't run it through Bash.
4. Open `http://localhost:5174/`, or `http://localhost:5174/?need=<term>` when the user gave a term (URL-encode it).
5. Tell the user where picks go: `sandbox/gallery/picks.json`. Don't apply them to `curated.json` or run refresh unless asked.

Never commit anything under `sandbox/gallery/src/items/`.
