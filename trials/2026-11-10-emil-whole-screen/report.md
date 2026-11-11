# Trial: Emil's motion skills as a whole-screen step (dry run)

**Purpose:** prove the framework. Two earlier hand-run trials had Emil Kowalski's motion skills (`emil-design-eng`, `animate`) lose as a whole-screen step, so the framework was expected to reproduce that reject.

**Result: it did not. Variant B won all three screens.** Under the adopt rule this would be an adopt. No adoption action is taken: the skills are already bundled, and what this shows is that the earlier reject did not reproduce here.

## Setup

- Slot: challenger-style insert. B adds step 2b (`emil-design-eng`, then `animate`) between `break-ui` and `impeccable`, and removes the "don't use them as a whole-screen step" line. A is `design-pass` unchanged. The same position lost in the earlier trial 2.
- Screens: Orders, Settings, Products (the plain screens as of `91cdc07`; the slop screens did not exist yet).
- Preset for both: Safe mode, no control motion, no design-system build, plan approved, no new packages.
- Both ran as sub-sessions on Sonnet, medium effort, each in its own worktree, reading the skill files from that worktree.

## Result

| Screen | Winner | Variant |
|---|---|---|
| Orders | Y | B |
| Settings | Y | B |
| Products | Y | B |

One judge, blind, live pages, one run per variant.

## Numbers

| | Before | A | B |
|---|---|---|---|
| Build | pass | pass | pass |
| JS (gzip) | 346.3 kB | 345.4 kB | 345.7 kB |
| CSS | 105.9 kB | 110.5 kB | 110.3 kB |
| Pipeline commits | - | 3 | 4 |
| Diff | - | 8 files, +753 -192 | 9 files, +665 -173 |
| New packages | - | none | none |

Tokens and wall time: not recorded. Planted-slop counts: not applicable, the slop screens were added after this run.

## Step conflicts

- B's step 3 (impeccable) changed 2 lines on top of the motion step; it did not undo it.
- B's motion step added `useFirstReveal.ts` (first-load stagger), a tab underline slide, press feedback, status fades and a reduced-motion fallback in CSS, with no new package (`motion` was already installed).
- No lock broken in either variant.

## Why this may not contradict the earlier trials

- Different app: the earlier trials ran on a Tauri desktop app, this one on the sandbox.
- One judge, one run per variant, no A-versus-A control, so run-to-run variance is unmeasured.
- The model and the exact skill versions of the earlier trials are not recorded.
- B also had one more pipeline step; the judge saw live pages, so motion was visible to them.

## A-vs-A control (`2026-11-10-aa-control`)

Same pipeline, same screens, identical trees, two independent runs, same judge, blind. The key mapped X to run B on all three screens; the judge preferred X, so run B "won" 3 of 3 with no candidate involved.

| | Run 1 (A) | Run 2 (B) |
|---|---|---|
| JS (gzip) | 343.7 kB | 344.1 kB |
| Pipeline commits | 4 | 3 |
| Diff | 7 files, +527 -230 | 8 files, +511 -165 |

**Reading:** a 3-0 sweep is reachable by chance (or by a judge bias toward one position) between identical pipelines. The dry-run 3-0 for Emil's motion therefore proves nothing, and the adopt rule (2 of 3 screens, one judge, one run) cannot separate a real effect from noise on a clean win.

**Adopt rule change:** a win needs a rerun of both variants on the same screens, with B ahead again, before any adopt. Single-run results are "promising" at most.

## Limits

One judge, one run per variant, one sandbox app. The thin screens have no dark mode, so judging was light only.
