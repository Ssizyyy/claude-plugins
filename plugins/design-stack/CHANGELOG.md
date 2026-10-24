# Changelog

Installs only pick up a release when `version` in `.claude-plugin/plugin.json` changes.

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
