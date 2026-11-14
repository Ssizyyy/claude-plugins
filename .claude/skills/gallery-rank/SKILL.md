---
name: gallery-rank
description: Score the UI gallery's components 1 to 5 from live screenshots and their source, and write sandbox/gallery/ranking.json as a hint for the review pass. Use for /gallery-rank <family|source|all> [--limit N] [--resume] [--force].
disable-model-invocation: true
---

# Gallery rank

Scores fetched gallery items so the user's review pass starts with the best and worst already sorted. The score is a **hint**: it never touches `picks.json`, and the user's picks always win. Project skill, not shipped with the plugin.

Arguments: `<family|source|all>` (a source such as `ui-layouts`, a family such as `hero`, or `all`), `--limit N` (stop after N items), `--resume` (the default: items that already have a score are skipped), `--force` (rescore those too).

Run from the repo root; the gallery lives in `sandbox/gallery`.

## Steps

1. **Server.** The gallery must be running and its items fetched (`sandbox/gallery/src/items/_status.json` exists; otherwise `npm run gallery:fetch -- --all`). If no server answers, start one with `preview_start` (the `gallery` entry, or `gallery-alt` if 5174 is taken) and note its port. Never kill an existing server.
2. **Select.** `node scripts/rank-prep.mjs select <scope> [--limit N] [--force]` (in `sandbox/gallery`) prints the ids still to rank: fetched, not deleted, not yet scored, unreviewed and candidate first. Tell the user the count before starting. Run in batches of 8 ids.
3. **Screenshots**, per batch, in the background: `node scripts/shots.mjs --port <port> <ids...> > .rank-batches/shots-<n>.jsonl`. It drives the system Chrome (or Edge) through playwright-core, so no browser download. Output: `.rank-shots/<source>/<key>-light.jpg` and `-dark.jpg`, plus one JSON line per item with `state` (`rendered`, `blank`, `error`, `timeout`) and the error text. Both folders are gitignored.
4. **Score**, one Sonnet sub-agent per batch (`model: sonnet`, fresh context, up to 3 at a time). Give each agent: its ids, the rubric below, the path of its shots file, and this job: run `node scripts/rank-prep.mjs facts <ids>` for the facts, Read both screenshots per item (skip them for `error` items), read the source in `src/items/<source>/<key>/` only as far as the accessibility and reduced-motion calls need, then write `.rank-batches/batch-<n>.json`, an array of `{id, scores:{appFit,a11y,depCost,polish,unique}, reason, blank}`. One line for `reason` (under 160 characters, say the deciding factor). `blank: true` when the screenshots show nothing usable (empty stage, a spinner forever, an error), whatever the source looks like. Items whose shots say `error` get `blank: true`, all scores 1, and the error as the reason.
5. **Merge.** `node scripts/rank-merge.mjs .rank-batches/batch-*.json` computes `score` (mean of the five, blank capped at 2) and updates `ranking.json`. Merge after each batch so an interrupted run resumes cleanly.
6. **Report**: items scored, how many blank, the score histogram, the best 5 and worst 5, and a rough token estimate (items × about 4k tokens, from the screenshots and source read). Don't touch `picks.json`, `curated.json` or any plugin file.

## Rubric (each 1 to 5)

| Score | appFit: would a real app screen use it? | a11y: accessibility and reduced motion (read the source) |
|---|---|---|
| 5 | Fits a dashboard, form, settings or content screen as is | Real buttons/links, labels, focus styles, keyboard path; animation honours `prefers-reduced-motion` |
| 3 | Usable on marketing or with rework | Some semantics, motion not guarded, or hover-only affordances |
| 1 | Pure decoration, gimmick, or needs a site around it | Div soup, pointer-only, unguarded constant motion or flashing |

| Score | depCost | polish: from the screenshots | unique |
|---|---|---|---|
| 5 | Only the shadcn basics (`basic`) | Clean spacing, type and contrast on both stages | Nothing in the catalog does this |
| 3 | One extra light dependency (`extra`) | Fine on one stage, rough on the other | A close sibling exists, this one differs |
| 1 | Heavy (`three`, `gsap`+`ogl`, physics) for a small effect | Clipped, low contrast, broken layout, looks unfinished | Duplicates a better item in the neighbours list |

Score honestly across the range; if everything lands on 4, the hint is useless. Blank or erroring items score low on polish and appFit.

## Gallery side

`ranking.json` is read by the gallery: score and reason show on cards and the detail page, the grid sorts by it ("ranking") and filters by "Min score", and the detail page offers **Accept hint** (score 4 or more: Candidate; 2.5 or less or blank: Reject; in between: no hint). Accepting writes a normal pick, which the user can change.
