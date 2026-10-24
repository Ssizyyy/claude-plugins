# Changelog

Installs only pick up a release when `version` in `.claude-plugin/plugin.json` changes.

## 2.4.0 (2026-10-24)

- Mode is chosen by the skill you start, not by a question. `design-pass` is Safe (no new packages, no motion). New `design-pass-free` is Free (no dependency lock, heavy effects allowed, control motion included). It is model-invocable for premium-look requests ("I want a premium looking app") and counts such a request as the yes to Free and motion. The shared procedure moved to `design-pass/references/core.md`.
- In Free mode the React Bits tools (`reactbits-tools`) are used without being asked, for heroes, empty states and product shots with no fitting catalog item. Downloads still need your yes.
- New invoke-only `control-motion`: the Animate UI expressive step, runnable on its own after a Safe pass.
- Fixes from a Free-mode trial on the sandbox: a precedence section in `core.md` (the locks outrank third-party skill text; no questions, fix instead of report), a default when nobody can answer the design-system offer, allowed fake-API and `?data=worst` hooks, light-only before shots when the app has no dark mode, a note on stale inspector state and hash-router anchors; `control-motion` now states its real cost range and what to do on screens without selection controls; `reactbits-tools` saves exports from inside the page when downloads are unavailable.
- `design-pass` no longer reads or writes the `design-pass mode:` line in `DESIGN.md`; an existing line is ignored.

## 2.3.0 (2026-10-24)

- `design-pass` is now the single entry point. New intake step: when asked to build or design new screens or an app, it reads the repo, runs an adaptive interview (the `grilling` skill, no fixed questions), shows a plan table for approval, then builds each screen and runs the existing steps on it.

## 2.2.1 (2026-10-24)

- Fixed `design-pass` Brand pages: it told the model to invoke `frontend-design`, which is invoke-only, so the step was skipped. It now reads that skill's `SKILL.md` from the sibling folder instead.
- `reactbits-tools` is callable by the model, since `design-pass` runs it as a step.

## 2.2.0 (2026-10-24)

- `ui-component-catalog` adds React Bits: 218 animated components (text effects, animations, cards and menus, micro-interactions, WebGL backgrounds), TypeScript + Tailwind variant, installed with `npx shadcn add`. 84 are marked `?` as a shortlist for product UI; the rest are `unreviewed` showpiece effects. Only metadata and install commands are bundled (the license forbids redistributing the components). `refresh.mjs` now pulls four registries.
- New `catalog/sileo.md`: notes on the Sileo toast (`npm i sileo`).
- New invoke-only skill `reactbits-tools`: when to send the user to the hosted React Bits tools (Background Studio, Center Stage, Shape Magic; Texture Lab and Sound Lab on request).
- `design-pass` asks once whether to run Safe (dependency lock and avoid-list on, the default) or Free (new packages, WebGL and cursor effects allowed), saves the answer in `DESIGN.md`, and always requires reduced-motion fallbacks. It suggests Sileo when a project has no toast library.

## 2.1.1 (2026-10-24)

- Fixed `ui-component-catalog` loading with empty metadata: its description contained an unquoted `: `, which broke the YAML front matter, so the skill never triggered on its own. The description is now quoted.
- Ships the `design-pass` step 0 design-system interview to installs that got 2.1.0 before it merged.

## 2.1.0 (2026-10-22)

- Added `ui-component-catalog`: 535 shadcn-registry components from useLayouts, ui-layouts and beUI, plus css-loaders notes, with what each is good for, which were used, adopted or rejected and why, and how to install them. Regenerate with `scripts/refresh.mjs`.
- `design-pass` checks the catalog before hand-building a control (step 1 and brand pages). The dependency lock now allows `npx shadcn add` when it brings no new npm packages.
- `design-pass` step 0: when tokens are missing or thin, it offers to build a design system first (an interview, then tokens, `DESIGN.md` and an approved swatch page).
  This change merged after 2.1.0 without its own version bump, so installs made before it don't have it until the next release.

## 2.0.0 (2026-10-22)

First public release.

- `design-pass` runs `design-taste-frontend` (layout and states), `break-ui` (stress), then `impeccable` (polish and audit), with optional control motion, in the order that won blind trials.
- Bundles third-party skills: `design-taste-frontend` (Leonxlnx/taste-skill), `break-ui`, `pick-ui-library` and Emil Kowalski's motion skills, `impeccable` (pbakaus/impeccable) and Anthropic's `frontend-design`. Everything except `design-pass`, `design-taste-frontend`, `break-ui` and `impeccable` is invoke-only.
