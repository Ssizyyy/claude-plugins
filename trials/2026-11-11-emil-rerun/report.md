# Trial: Emil's motion skills as a whole-screen step (rerun)

**Purpose:** rerun the dry run (`trials/2026-11-10-emil-whole-screen/report.md`), because the A-vs-A control swept 3-0 with no candidate and made that 3-0 unusable.

**Result: B won 1 of 3 screens. Under the adopt rule (B must win at least 2 of 3) this is a reject for this slot.**

## Setup

- Slot: same as the dry run. B adds step 2b (`emil-design-eng`, then `animate`) between `break-ui` and `impeccable` and drops the "don't use them as a whole-screen step" line. A is `design-pass` unchanged.
- Screens: Orders, Settings, Products (plain screens at `91cdc07`).
- Preset for both: Safe mode, no control motion, no design-system build, plan approved, no new packages.
- Fresh worktrees, Sonnet 5.5, medium effort, one sub-session per variant, skill files read from the worktree.

## Result

| Screen | Winner | Variant |
|---|---|---|
| Orders | Y | A |
| Settings | Y | A |
| Products | Y | B |

One judge, blind, live pages, one run per variant.

## Numbers

| | Before | A | B |
|---|---|---|---|
| Build | pass | pass | pass |
| JS (gzip) | 346.3 kB | 349.8 kB | 349.9 kB |
| CSS | 105.9 kB | 107.3 kB | 108.6 kB |
| Pipeline commits | - | 3 | 4 (plus the setup edit) |
| Diff | - | 7 files, +412 -126 | 9 files, +632 -146 |
| New packages | - | none | none |

Tokens and wall time: not recorded. Planted-slop counts: not applicable, the slop screens were added after these runs.

## All runs of this slot

| Run | B (Emil) wins |
|---|---|
| Dry run | 3 of 3 |
| A-vs-A control (no candidate) | 3 of 3 for one identical side |
| Rerun | 1 of 3 |

The control shows a 3-0 sweep happens with no real difference, so the dry-run 3-0 is noise. The rerun is the only result that counts, and B lost it.

## Step conflicts

Not checked beyond the session reports. A's session reported weak visual checks (wrong pane size, no dark mode or 390 px after-shots). B did not run the impeccable `context` script.

## Limits

One judge, one run per variant, one sandbox app, light mode only. Whether the Products win is real or noise is not known.
