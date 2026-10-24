---
name: design-pass
description: Run the full design pass on one or more app screens of an existing frontend, in the order that won blind trials — taste for layout and states, break-ui for stress, then impeccable polish and audit — with optional control motion. Use for /design-stack:design-pass, "redesign this page/screen", "give <screen> a design pass". For brand or marketing pages (login, onboarding, landing), see Brand pages first.
---

# Design pass

Redesign the screens named in the args (or the conversation) by running skills from this plugin in a fixed order. Each step owns one layer. Later steps must not undo earlier ones. The skills named below ship in this plugin; invoke them as `design-stack:<name>`.

## 0. Lock, prepare, ask

- **Lock the brand.** Find the project's tokens and fonts (theme CSS, tokens.json, Tailwind theme). Use only existing variables: no new colours, no hardcoded hex, no new fonts. If the tokens are missing or thin (no semantic roles like surface, muted, border, danger; no dark mode; no type scale), suggest creating the design system first, below, and wait for the answer.
- **Design system first (only if the user says yes).** Interview the user with the `grilling` skill if it is installed; otherwise run the same kind of interview inline: rounds of numbered questions, each with your recommended answer, until nothing is left open. Cover brand personality, the colour palette (brand hue, neutrals, semantic roles, light and dark), type (families and scale), spacing, radius and elevation. Seed recommendations from what the repo already has. Then:
  1. Write the tokens in the project's existing theme format (CSS variables, Tailwind theme or tokens.json), mapped to shadcn's variable names if the project uses shadcn.
  2. Write a short `DESIGN.md` at the repo root: personality, what each palette role is for, type and spacing scale, do and don't rules.
  3. Render a swatch page (palette in light and dark with contrast ratios, type scale, a few controls built from the tokens) and screenshot it for the user's approval. Iterate until approved, then commit tokens and `DESIGN.md` separately. The new tokens are now the brand lock.
- **Ask the mode first.** Read `DESIGN.md` for a line `design-pass mode: safe` or `design-pass mode: free`; if there is none, ask once: "Safe (locks on, the default) or Free (new packages, WebGL and cursor effects allowed; reduced-motion fallbacks still required)?" Save the answer to `DESIGN.md` (create it if missing, one line) and re-ask only if the user says so.
  - **Safe**: the dependency lock below holds, and the catalog's avoid-list (three.js and shader items, cursor trails, glass over text, scroll hijacking) stays avoided.
  - **Free**: no dependency lock, and heavy catalog items (`dependencies` with `three`, `ogl`, `gsap`, `matter-js`) and cursor effects are allowed. Control motion counts as yes. The reduced-motion fallback is still required in both modes. Report every added package and heavy effect with a one-line cost (size, fallback).
- **Lock dependencies (Safe mode).** No new npm packages unless the user says yes to control motion below. A library that would clearly help goes in your report, not in package.json. A catalog component added with `npx shadcn add` is fine when it brings no new npm packages; otherwise recreate it or report it.
- **Toasts.** If a screen needs transient feedback (save, delete, async result) and the project has no toast library, suggest `sileo` (`npm i sileo`, see `catalog/sileo.md` in `design-stack:ui-component-catalog`). In Safe mode it goes in the report for approval; in Free mode install it. If the project already has a toast library, keep it.
- **Lock behaviour.** Keep the same data calls, props and copy keys. New keys are fine.
- **Make it render in a browser with fake data.** If screens only load data inside a native shell (Tauri, Electron) or behind auth, add a fixture fallback first. Outside the shell, the data layer returns fixed demo data shaped like the real backend's, with URL params for the empty, many, error and logged-out states. Commit that separately; every later step depends on it.
- **Record the before.** Screenshot each target screen and state, in light and dark.
- **Ask once about control motion** (Safe mode only; Free mode counts it as yes), before any code: "Add animated motion to the controls (selection underlines, option tiles, press feedback, inline panels)? It needs a new dependency and adds roughly 40 kB of JavaScript." Run the Motion step only on yes.

## 1. Layout and states: `design-taste-frontend`

Use the app-screen run (`references/app-screens.md`) with `--keep palette,type` and low variance. Take composition, hierarchy and states (loading, empty, error, many) from it, never colours or fonts. Point its inspector at the dev server URL. Don't fetch imagery for app screens.

Before hand-building a control or pattern (tabs, menus, drawers, inline edit, filters, list rows, inputs), check `design-stack:ui-component-catalog` for a used or adopted component and take it over building your own. Map it to the project's tokens and follow the mode's dependency rules. For a hero, empty state or product shot, `design-stack:reactbits-tools` lists hosted tools that make backgrounds, device mockups and logo marks. List the catalog keys you used or rejected, with reasons, in the report.

## 2. Stress: `break-ui`

Feed every screen worst-case fixture data: long names, zero, huge counts, missing fields, non-Latin text. Fix what breaks.

## 3. Finish: `impeccable` polish, then audit

Run impeccable's `polish` and then its `audit` on each screen, and fix what they flag. Decline anything that touches the locks from step 0. Skip impeccable's `colorize`, because colour is locked.

## 4. Motion (only if the user said yes in step 0)

The tested choice for control motion is **Animate UI at its expressive level**. It is not bundled here because its license (MIT + Commons Clause) forbids redistributing it, so install it yourself in the project:

1. `npx skills add imskyleen/animate-ui` (project scope), and add the `@animate-ui/react` and `motion` packages. This is the one exception to the no-installs lock; say so in the report.
2. Tell the skill the level up front: **expressive**. Its codemod (path A) only touches `components/ui/*` and does nothing for hand-built controls; use path B (import swap) or C (rules).
3. Pitfalls found in the trial:
   - Wrap each selection control in a `motion.div` with `layoutRoot`. Otherwise, if the page shifts after load (a skeleton replacing content), the shared-layout underline stays stranded at the old position.
   - Animated numbers must settle fast (well under 300 ms); a roughly 1 s settle on counts read at a glance felt slow.
   - Stagger rows only on the first load, never when a filter, search or sort changes what is visible.
   - Expect about +40 to +48 kB of JavaScript (about +15 to +17 kB gzip); the subtle level costs about +11 kB.

Emil Kowalski's motion skills ship in this plugin as invoke-only skills, for one-off component motion where motion is the subject (a drawer, a toast, a drag): `design-stack:animate`, `design-stack:emil-design-eng`, `design-stack:animation-performance`, `design-stack:animation-vocabulary`, `design-stack:improve-animations`, `design-stack:find-animation-opportunities`, and `design-stack:review-animations` (the user must start that one). Don't use them as a default whole-screen step: in two trials they made dense app screens worse.

## 5. Prove it

Typecheck and build. Screenshot the same screens and states as the before, in light and dark. Report the before and after per screen, what each step changed, any libraries added or wished for, and the bundle size change.

## Brand pages

On a login page, `design-stack:frontend-design` beat this whole stack. It suits screens that are read once and should feel like the product's front door: login, onboarding, landing, and the first-run empty state. For these pages, use `frontend-design` instead of step 1. It is invoke-only, so the model cannot call it: read `../frontend-design/SKILL.md` (relative to this skill's base directory) and follow it. Keep steps 2 to 5. Don't stack it with taste on the same screen, because their rules conflict. Check `design-stack:ui-component-catalog` for sections (hero, features, stats, FAQ, footer) and effects before building them: blocks are starting points, so re-skin them to the tokens and rewrite the copy.

## Evidence

All trials were on one desktop app (Tauri + React + shadcn), judged blind by one person, with one run per variant.

- **Trial 1 (Orders, Settings, Login; 4 variants).** taste + Emil + impeccable won Orders and Settings, and frontend-design alone won Login. taste + Emil came last, below taste alone.
- **Trial 2 (a log page; 3 orders).** taste, then break-ui, then impeccable (no Emil) won, judged live as well as in screenshots. impeccable-first came second. The order with Emil's motion before impeccable came last.
- **Trial 3 (controls on two screens; no Animate UI vs Animate UI at three levels, judged live).** Ranking on both: expressive 1st, subtle 2nd, no Animate UI 3rd, "more" (subtle plus overshoot and blur) 4th. The ranking is not monotonic in how much motion there is.

What held: impeccable last appears in every winner of the layout trials; Emil's motion skills hurt as a whole-screen step; control-level motion from Animate UI at expressive was preferred over none. Still open: whether impeccable-first beats impeccable-last without Emil, and why "more" lost. It is a small sample: one app, one judge. If your project shows otherwise, trust the project.
