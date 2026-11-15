# UI component sources: candidates for `ui-component-catalog` (2026-11)

Researched 2026-11-15 from primary sources: each site, its `/r/registry.json`, the GitHub repo and its LICENSE file. Nothing was installed and no site code was run. Counts come from the registry JSON (items include demos and hooks) or the repo tree, so treat them as approximate. Star counts and last-push dates are from the GitHub API on the same day.

Catalog today: useLayouts, ui-layouts, beUI, React Bits, plus Sileo and css-loaders. Design-pass **Safe mode** = no new npm packages (React, Tailwind, shadcn primitives only); **Free mode** allows heavy libraries.

## Comparison

| Source | License | Install | Items | Stars / last push | Safe-mode fit | Recommendation |
|---|---|---|---|---|---|---|
| kokonutui.com | MIT (some items marked PRO on the site) | shadcn registry | 121 registry items (116 components) | 2.3k / 2026-11-13 | Medium: 42 items have no deps | **Adopt** |
| cult-ui.com | MIT | shadcn registry | ~150 free (154 `ui` + 153 `component` entries incl. demos) | 7.4k / 2026-10-29 | Medium: 193 of 307 entries have no deps | **Adopt** |
| smoothui.dev | MIT | shadcn registry + own CLI | 229 ui + 35 blocks | 1.1k / 2026-11-10 | Good: 130 are `motion`-only | **Adopt** |
| animata.design | MIT | copy-paste only (no registry) | ~215 component files, 22 categories | 3.0k / 2026-11-03 | Good: Tailwind-first, `motion` in some | **Park** |
| eldoraui.site | MIT | shadcn registry | ~25 components + 16 blocks (rest are demos) | 2.0k / 2026-09-26 | Medium | **Skip** |
| skiper-ui.com | Proprietary, paid | shadcn CLI, login-gated | 106 (most premium) | no official repo | Poor | **Skip** |
| hover.dev | Proprietary, paid | copy-paste | not published | closed source | Poor | **Skip** |

Recommended to add: **kokonutui, cult-ui, smoothui**. Park animata. Skip eldoraui, skiper-ui, hover.dev.

## kokonutui.com

- **License**: MIT, copyright "kokonutUI". Redistributing or recreating components is allowed. The site also sells PRO templates and a few PRO components (slash command menu, image-generation card, two hero sections); those are not in the public registry, so the catalog must not index them.
- **Install**: `npx shadcn@latest add @kokonutui/<name>` or `npx shadcn@latest add https://kokonutui.com/r/<name>.json`. Registry: `https://kokonutui.com/r/registry.json`.
- **Stack**: React, Tailwind, shadcn. Deps across the registry: `motion` (69 items), `lucide-react` (65), `class-variance-authority` (3). 42 items need nothing extra. No GSAP or three.js.
- **Content**: 116 components, 4 hooks. Categories: AI (27, such as ai-prompt, tool-approval, tool-calls, citations, diff-review, agent-lanes, message-queue), backgrounds, cards, buttons, text effects, inputs and pickers, commerce (seat-map, boarding-pass, slide-to-confirm), feedback (promise-toast, inline-alert, empty-state).
- **Quality**: 2,324 stars, pushed 2026-11-13, 100 commits since 2026-08-01, 12 contributors, Biome + knip, own CLAUDE.md. Actively maintained.
- **Fit**: Good in both modes. The AI/agent UI set is the most complete of the seven and fills a gap next to beUI's prompt-input and agent-activity.
- **Standouts**: ai-tool-approval, ai-agent-lanes, ai-diff-review, ai-message-queue, slide-to-confirm, promise-toast, wheel-picker, spending-ring.
- **Overlap**: AI chat items with beUI; text effects and backgrounds with React Bits (canvas/shader backgrounds need the `guard` flag). Product-UI items (commerce, feedback) are new.

## cult-ui.com

- **License**: MIT (LICENSE.md, copyright Jordan-Gilliam). Free to redistribute or recreate.
- **Install**: `npx shadcn@latest add https://www.cult-ui.com/r/<name>.json`, or register a namespace in `components.json`. Also offers an MCP server and an LLM-oriented docs section.
- **Stack**: React, Tailwind, shadcn. Many items use Base UI (`@base-ui/react`, 15). Others pull `motion` (65), `@paper-design/shaders-react` (10), `three`, `cobe`, `border-beam`, `geist`, `jotai`, hugeicons/tabler. 193 of 307 entries have no dependencies.
- **Content**: 154 `registry:ui` + 153 `registry:component` entries (the second set includes demos and illustrations). Categories: AI inputs (prompt composer, halo-search, prompt-library), generative UI (polls, feature voting), form controls (halo-* inputs), feedback (halo-toast, badge, progress), navigation and overlays (dock, direction-aware-tabs, floating-panel, popover-form, family-drawer), marketing heroes and illustrations (shader heroes, Apple device mockups).
- **Quality**: 7,390 stars (highest of the seven), pushed 2026-10-29, 24 commits since 2026-08-01, 8 contributors, changesets, 58 items added recently.
- **Fit**: Safe mode: use the no-dependency app items (expandable, floating-panel, popover-form, direction-aware-tabs, sortable-list). Free mode: shader and three.js heroes. Treat shader items as marketing-only.
- **Standouts**: popover-form, floating-panel, expandable, direction-aware-tabs, dock, dynamic-island, kanban-board, analytics-chart, color-picker.
- **Overlap**: moderate with beUI (tabs, popovers, inputs) and React Bits (shader backgrounds). The "Halo" form-control family and the generative-UI polls are new.

## smoothui.dev

- **License**: MIT (copyright Eduardo Calvo). Free to redistribute or recreate.
- **Install**: `npx shadcn@latest add @smoothui/<name>`, `npx smoothui-cli add <name>`, or the registry at `https://smoothui.dev/r/registry.json` (2.6 MB: grep it, do not read it whole).
- **Stack**: React, Tailwind, shadcn. Deps: `motion` (222 items), `lucide-react`, `@base-ui/react` (31), plus `gsap` (1 item, gooey-popover), `popmotion`, `cmdk`, `react-day-picker`, `input-otp`, `react-tweet`. 130 items need `motion` only; 37 need nothing.
- **Content**: 229 ui, 35 blocks (cta, faq, features, footer, header x6, logo-cloud, pricing, stats, team, testimonials), a chat template, 7 themes. Categories: patterns/forms (OTP, country picker, duration picker, file tree, form morph), navigation (dock, breadcrumb, floating navbar), buttons, many text animations, micro-interactions.
- **Quality**: 1,056 stars, pushed 2026-11-10, 100 commits since 2026-08-01, 6 contributors, release-please, Playwright tests, an accessibility guide in the docs. Active.
- **Fit**: Best Safe-mode fit of the set: most items need only `motion`, and the docs include accessibility and reduced-motion guidance.
- **Standouts**: the 35 blocks, country-picker, duration-picker, favicon-search, file-tree, animated-stepper, auth-form, siri-orb, dynamic-island.
- **Overlap**: blocks overlap ui-layouts and useLayouts; text animations overlap React Bits. Form patterns and pickers add new ground.

## animata.design

- **License**: MIT (copyright Animata). Free to redistribute or recreate.
- **Install**: copy-paste from the docs. No shadcn registry (`/r/registry.json` returns 404). Dependencies are installed by hand. It fits the catalog's Sileo / css-loaders pattern (a hand-written note), and `refresh.mjs` cannot ingest it.
- **Stack**: React, Tailwind, Next docs site, Storybook. Per-component deps vary; `motion` is the main one.
- **Content**: ~215 component files in 22 categories: background (10), bento-grid, button (13), card (11), container, fabs, graphs, hero, icon, image, list, overlay, preloader, progress, scroll, section, skeleton, tabs, text, widget.
- **Quality**: 3,003 stars, pushed 2026-11-03, 8 commits since 2026-08-01, 30 contributors. Slower pace than the registry-based sources.
- **Fit**: Good, since many items are pure Tailwind keyframes. The cost is manual dependency tracking.
- **Standouts**: skeleton, preloader, graphs (bar, donut, gauge, progress ring; useful for app screens), fabs.
- **Overlap**: high with React Bits and ui-layouts for text, cards and backgrounds. Graphs, skeletons and preloaders are the new part.
- **Verdict**: park until it ships a registry, or write a hand note covering only the graphs, skeleton and preloader categories.

## eldoraui.site

- **License**: MIT (copyright Mudunuri Bhaskara Karthikeya Varma).
- **Install**: `npx shadcn@latest add https://www.eldoraui.site/r/<name>.json`. Site is labelled BETA.
- **Stack**: React, Tailwind, `motion`, `lucide-react`; some items add `three`, `ogl`, `cobe`, `react-spring`, `react-icons`, headlessui.
- **Content**: 115 registry entries, of which only ~39 ui and 16 blocks (header, logo-cloud, testimonials, features, cta, pricing, footer) are real; the rest are demos. Mostly text effects, a globe, device mockups, a few backgrounds.
- **Quality**: 1,977 stars, pushed 2026-09-26, 1 commit since 2026-08-01, 3 contributors. Slowing.
- **Fit**: Medium. Little that the catalog does not already hold.
- **Overlap**: text effects (blur-in, fade, wavy, word-pull-up, gradual-spacing), marquee, animated-list and grid patterns duplicate React Bits and ui-layouts. Only the Apple device mockups and cobe-globe are distinct, and cult-ui has similar mockups.
- **Verdict**: skip.

## skiper-ui.com

- **License / price**: proprietary, paid. The site shows Premium $129 and Exclusive $549 one-time tiers, "106+ components", a few free. The FAQ on commercial and client use is rendered client-side and was not readable, so the exact terms are unverified. Source is gated behind a login.
- **Install**: shadcn CLI (`npx shadcn add @skiper-ui/skiperNN`) after account login. Components are numbered `skiper1..skiper106`, not named.
- **Stack**: Next.js, Tailwind, `motion`. Single-file components.
- **Quality**: no official public repo. The only GitHub hit (`nischayhq/skiper-ui`, 20 stars, last push 2025-07) is a landing-page clone, not the component source.
- **Standouts** (from the site): image cursor trail, Vercel-style tooltip, dynamic island, token-swap UI.
- **Verdict**: skip. Paid, closed, numbered keys; the catalog is public, so it could not list premium source or recreate premium items. Revisit only if a licence is bought and the notes stay private.

## hover.dev

- **License / price**: proprietary. Basic components free; Hover Pro $49 (struck from $149) lifetime. The site states components are subject to copyright and may not be redistributed without written consent, and its FAQ forbids repackaging them into a competing library, theme or template. Recreating from a public catalog note would run into this.
- **Install**: copy-paste from the site; no registry or CLI. JS and TypeScript variants.
- **Stack**: React, Tailwind, Motion (Framer Motion) and occasionally other animation libraries.
- **Content**: no published count. Categories: ~20 component types (accordions, buttons, calendars, cards, carousels, modals, navbars, tabs, toggles) and section types (hero, features, pricing, FAQ, testimonials, stats, sign-in, 3D, kanban).
- **Quality**: "30,000+ devs" claim on the site, copyright 2024, closed source.
- **Fit**: Poor for a public catalog (licence) and no machine-readable index.
- **Verdict**: skip.

## Notes for whoever implements the adds

- All three adoptable sources are shadcn registries, so `refresh.mjs` can ingest them like beUI. Keep `registry:hook`, `registry:theme` and demo entries out of the index.
- smoothui's registry is 2.6 MB; fetch once, do not paste.
- Mark shader and three.js items (cult-ui heroes) and the `gsap` item (smoothui gooey-popover) as heavy. Mark everything with `motion` as `guard`, as the catalog already does.
- Strip kokonutui's PRO-labelled items if any appear in a future registry.
- Unverified: skiper-ui's commercial-use terms, kokonutui's exact PRO item list, animata's per-component dependency list.
