---
name: ui-component-catalog
description: 'Catalog of 530+ ready-made React/shadcn UI components from useLayouts, ui-layouts and beUI (beui.dev), plus css-loaders: what exists, what each is good for, what was already used, adopted or rejected and why, and how to install or recreate it. Use before designing or building any UI (landing pages, app screens, hero, features, pricing, FAQ, carousels, cards, charts, AI/chat UI, animated effects) so components are chosen from the catalog instead of hand-rolled or re-searched.'
---

# UI component catalog

Three shadcn-registry libraries plus css-loaders, indexed once so any project can reuse the research.

- **useLayouts** (https://uselayouts.com, MIT): 64 polished app and marketing components.
- **ui-layouts** (https://ui-layouts.com, MIT): 327 items. 253 components (buttons, cards, marquees, beams, carousels, modals, forms, effects) and 74 full-section blocks (hero, feature, stats, pricing, FAQ, team, testimonial, footer).
- **beUI** (https://beui.dev, MIT): 144 animated React/Next.js components built with Motion and Tailwind: inputs, pickers, sliders, tabs, modals, sidebars, tables, text effects, financial charts, AI/chat UI (prompt-input, streaming-response, agent-activity), 404 pages. Depends on `motion`; shared `lib/ease.ts`, `lib/utils.ts`.
- **css-loaders** (https://css-loaders.com): 600+ single-element pure-CSS loaders in 43 collections. Not a registry; copy CSS from the site. See `catalog/css-loaders.md`.

## Files (all next to this file)

| File | Use |
|---|---|
| `catalog/INDEX.md` | Read first. One line per family, items marked `*` used, `+` adopted, `?` candidate, `-` rejected. Small enough to read whole. |
| `catalog/css-loaders.md` | Hand-written notes on css-loaders.com: collections, usage rules, which suit product UI. Not touched by refresh.mjs. |
| `catalog/components.json` | Full records. Grep by key or family. Fields: id, source, key, title, description, type, family, dependencies, install, status, surface, motion, note. |
| `catalog/curated.json` | The hand-written evaluations. Edit this, never components.json. |
| `scripts/refresh.mjs` | `node scripts/refresh.mjs` re-pulls all three registries and rebuilds the two generated files. Run it in the plugin's source repo, never in the installed copy: an update replaces the installed folder. |

## Workflow

1. Read `catalog/INDEX.md`. Pick candidates by family and marker. Prefer `used` and `adopted` over `unreviewed`.
2. Grep `components.json` for the keys you picked. Check:
   - `surface`: app, marketing or both. Marketing effects do not belong in dense product UI.
   - `motion`: `guard` means add a `prefers-reduced-motion` guard.
   - `dependencies`: heavy ones (three.js, react-hook-form, zod, lenis) need a reason.
   - `note`: where it was used before, or why it was rejected.
3. Check the current project's own rules first (design tokens, brand, a11y). They override the catalog. Do not import a component's own colours or fonts; map them to the project's tokens.
4. Install: `npx shadcn@latest add https://ui-layouts.com/r/<key>.json` for ui-layouts, `npx shadcn@latest add https://beui.dev/r/<key>.json` for beUI. useLayouts needs `"registries": {"@uselayouts": "https://uselayouts.com/r/{name}.json"}` in `components.json`, then `npx shadcn@latest add @uselayouts/<key>`. Each record's `install` field has the exact command. Docs and source for ui-layouts are also reachable through the `ui-layouts` MCP server if it is configured (`search_components`, `get_source_code`).
5. Design canvases and static mockups cannot run React. Recreate the pattern in HTML/CSS (CSS `animation-timeline: view()` for scroll reveals, `@property` for counters and conic borders, SVG `stroke-dashoffset` for beams, native `<details>` for accordions) and note the source key.
6. After deciding, put each choice and its reason in your report (used where, or rejected why). Do not edit the installed catalog. To make a decision permanent, edit `catalog/curated.json` in the plugin's source repo (set `status`, add the reason to `note`, no project names: the file is public), run `node scripts/refresh.mjs` there and release a new plugin version. Rejections with a reason save the next project from re-evaluating.

## Rules that hold in every project

- Every moving effect needs a reduced-motion fallback that shows the final state. Autoplay needs a visible pause control.
- Keyboard operable, real buttons and links, visible focus. Decorative motion and text copies get `aria-hidden`.
- Avoid by default: scroll hijacking (`smooth-scroll`, `horizontal-scroll`), three.js and shader items, glass effects over text, cursor-trail effects. They cost accessibility or weight and rarely carry content.
- Full-section blocks (`hero-*`, `feature-*`, `stats-*`, `faq-*`, `footer-*`, `pricing-*`) are starting points, not finished design: re-skin to the project's tokens and rewrite the copy.
- useLayouts, ui-layouts and beUI are MIT. css-loaders states no licence; confirm before shipping its CSS.

## Gaps to know about

- ui-layouts items have no titles or descriptions in its registry; the catalog humanises the key. Look at the docs page `https://ui-layouts.com/components/<family>` when a key is unclear.
- Most ui-layouts blocks are `unreviewed`. When one is chosen, review it and write its entry.
