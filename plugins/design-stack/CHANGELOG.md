# Changelog

Installs only pick up a release when `version` in `.claude-plugin/plugin.json` changes.

## 2.1.0 (2026-10-22)

- Added `ui-component-catalog`: 535 shadcn-registry components from useLayouts, ui-layouts and beUI, plus css-loaders notes, with what each is good for, which were used, adopted or rejected and why, and how to install them. Regenerate with `scripts/refresh.mjs`.
- `design-pass` checks the catalog before hand-building a control (step 1 and brand pages). The dependency lock now allows `npx shadcn add` when it brings no new npm packages.
- `design-pass` step 0: when tokens are missing or thin, it offers to build a design system first (an interview, then tokens, `DESIGN.md` and an approved swatch page).
  This change merged after 2.1.0 without its own version bump, so installs made before it don't have it until the next release.

## 2.0.0 (2026-10-22)

First public release.

- `design-pass` runs `design-taste-frontend` (layout and states), `break-ui` (stress), then `impeccable` (polish and audit), with optional control motion, in the order that won blind trials.
- Bundles third-party skills: `design-taste-frontend` (Leonxlnx/taste-skill), `break-ui`, `pick-ui-library` and Emil Kowalski's motion skills, `impeccable` (pbakaus/impeccable) and Anthropic's `frontend-design`. Everything except `design-pass`, `design-taste-frontend`, `break-ui` and `impeccable` is invoke-only.
