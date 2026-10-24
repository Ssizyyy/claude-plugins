# Design pass core

Shared procedure for `design-stack:design-pass` (Safe) and `design-stack:design-pass-free` (Free). The entry skill that sent you here sets the **mode**; never ask the user which mode to use. Redesign the screens named in the args (or the conversation), or build new ones, by running skills from this plugin in a fixed order. Each step owns one layer. Later steps must not undo earlier ones. Skills named below ship in this plugin; invoke them as `design-stack:<name>`.

## Intake: new screens or a new app

Run this first when the args or conversation ask to build, design or create something, or name screens that don't exist in the project. Skip it for plain redesigns of existing screens.

1. Look at the repo first (stack, tokens, components, existing screens, fixtures) so you never ask what you can read.
2. Interview the user with the `grilling` skill if it is installed; otherwise run the same kind of interview inline. There is no fixed question list: ask whatever you need to build well, in rounds of numbered questions with a recommended answer each, until nothing is left open. Typical ground: what the product is and who uses it, the screens and flows with their states, the data and fake-API shape, taste and brand preferences, design system, which pages are brand pages. Skip what the repo or earlier answers already settle.
3. Write a plan table: screen, skills that will run on it, libraries or catalog items, states covered. Show it and wait for approval. Change the plan on feedback; build nothing before a yes. This gate applies on every build run.
4. After approval, build each screen plainly first (structure, data via a fixture or fake API, every state), then run steps 0 to 5 below on it. Answers already given in the interview (design system) count as the answers to step 0's questions: don't ask twice.

## 0. Lock, prepare, ask

- **Lock the brand.** Find the project's tokens and fonts (theme CSS, tokens.json, Tailwind theme). Use only existing variables: no new colours, no hardcoded hex, no new fonts. If the tokens are missing or thin (no semantic roles like surface, muted, border, danger; no dark mode; no type scale), suggest creating the design system first, below, and wait for the answer.
- **Design system first (only if the user says yes).** Interview the user with the `grilling` skill if it is installed; otherwise run the same kind of interview inline: rounds of numbered questions, each with your recommended answer, until nothing is left open. Cover brand personality, the colour palette (brand hue, neutrals, semantic roles, light and dark), type (families and scale), spacing, radius and elevation. Seed recommendations from what the repo already has. Then:
  1. Write the tokens in the project's existing theme format (CSS variables, Tailwind theme or tokens.json), mapped to shadcn's variable names if the project uses shadcn.
  2. Write a short `DESIGN.md` at the repo root: personality, what each palette role is for, type and spacing scale, do and don't rules.
  3. Render a swatch page (palette in light and dark with contrast ratios, type scale, a few controls built from the tokens) and screenshot it for the user's approval. Iterate until approved, then commit tokens and `DESIGN.md` separately. The new tokens are now the brand lock.
- **Mode rules.** Safe: no new npm packages; a library that would clearly help goes in your report, not in package.json; a catalog component added with `npx shadcn add` is fine when it brings no new npm packages, otherwise recreate it or report it; the catalog's avoid-list (three.js and shader items, cursor trails, glass over text, scroll hijacking) stays avoided. Free: no dependency lock; heavy catalog items (`dependencies` with `three`, `ogl`, `gsap`, `matter-js`) and cursor effects are allowed; report every added package and heavy effect with a one-line cost (size, fallback). The reduced-motion fallback is required in both modes.
- **Toasts.** If a screen needs transient feedback (save, delete, async result) and the project has no toast library, suggest `sileo` (`npm i sileo`, see `catalog/sileo.md` in `design-stack:ui-component-catalog`). In Safe mode it goes in the report for approval; in Free mode install it. If the project already has a toast library, keep it.
- **Lock behaviour.** Keep the same data calls, props and copy keys. New keys are fine.
- **Make it render in a browser with fake data.** If screens only load data inside a native shell (Tauri, Electron) or behind auth, add a fixture fallback first. Outside the shell, the data layer returns fixed demo data shaped like the real backend's, with URL params for the empty, many, error and logged-out states. Commit that separately; every later step depends on it.
- **Record the before.** Screenshot each target screen and state, in light and dark.

## 1. Layout and states: `design-taste-frontend`

Use the app-screen run (`references/app-screens.md`) with `--keep palette,type` and low variance. Take composition, hierarchy and states (loading, empty, error, many) from it, never colours or fonts. Point its inspector at the dev server URL. Don't fetch imagery for app screens.

Before hand-building a control or pattern (tabs, menus, drawers, inline edit, filters, list rows, inputs), check `design-stack:ui-component-catalog` for a used or adopted component and take it over building your own. Map it to the project's tokens and follow the mode's dependency rules. For a hero, empty state or product shot, `design-stack:reactbits-tools` lists hosted tools that make backgrounds, device mockups and logo marks. List the catalog keys you used or rejected, with reasons, in the report.

## 2. Stress: `break-ui`

Feed every screen worst-case fixture data: long names, zero, huge counts, missing fields, non-Latin text. Fix what breaks.

## 3. Finish: `impeccable` polish, then audit

Run impeccable's `polish` and then its `audit` on each screen, and fix what they flag. Decline anything that touches the locks from step 0. Skip impeccable's `colorize`, because colour is locked.

## 4. Motion

Free mode: run `design-stack:control-motion` on each screen. Safe mode: skip; the user can run `/design-stack:control-motion` afterwards. For one-off component motion (a drawer, a toast, a drag) the invoke-only Emil Kowalski skills exist: `design-stack:animate`, `design-stack:emil-design-eng`, `design-stack:animation-performance`, `design-stack:animation-vocabulary`, `design-stack:improve-animations`, `design-stack:find-animation-opportunities`, `design-stack:review-animations` (the user must start that one). Don't use them as a default whole-screen step: in two trials they made dense app screens worse.

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
