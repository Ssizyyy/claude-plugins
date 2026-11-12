# Trial: modern-web-guidance as a reference in design-pass step 3

**Result: adopt.** B won 3 of 3 screens on the first run, then 2 of 3 with 1 tie on the rerun, and never lost a screen to A.

## Candidate

`GoogleChrome/modern-web-guidance`, `skills/modern-web-guidance`, commit `4dd968349e54` (Apache-2.0). A SKILL.md plus 209 guide files (2.4 MB). It drives an npm CLI, `modern-web-guidance@1.0.0` (`search`, `retrieve`, `legacy-scan`, `install`).

Pre-read findings:
- The npm package has no install scripts and no dependencies. `search` and `retrieve` read guides bundled in the package.
- **Telemetry on by default:** each `search` and `retrieve` starts a detached process that posts the query text, guide id, OS, agent name and version to `play.googleapis.com/log`. `DISABLE_TELEMETRY=1` turns it off.
- `install`, `update` and `uninstall` shell out to `npx skills …`. Not run.
- The SKILL.md says `npx -y modern-web-guidance@latest`; the guides also carry unpinned CDN snippets (`unpkg.com/...@latest`).

## Setup

- Slot: **Reference.** B adds one paragraph to `design-pass` step 3: consult the skill before fixing dialogs, popovers, selects, form fields, tables, tooltips, focus and validation. The shadcn component stays; the guide shapes CSS, accessibility and fallbacks.
- Trial copy: `@latest` pinned to `@1.0.0` by hand, `disable-model-invocation: true` added (invoke-only).
- Screens: `settings`, `m-checkout` (390 px), `d-logs`, all slop screens at `23e6992`.
- Preset for both: Safe mode, no control motion, no design-system build, plan approved, no new packages. Fresh worktrees, Sonnet 5.5, medium effort, one sub-session per variant.
- Run 1 also had S, a smoke test of the skill alone on `orders`, shown as a third option on the judge page.

### Deviation: B never ran the CLI

The auto-mode classifier denied `npx -y modern-web-guidance@1.0.0 search …` in S, and both the `npx` and a local `node …/modern-web.mjs` run in B. S then succeeded on the local copy; B did not. In both runs I ran the four queries myself with telemetry off (`confirmation modal dialog`, `command palette combobox`, `form field validation`, `responsive data table`), saved six guides to a file (`dialog`, `platform-controls-dismiss-dialog`, `prevent-page-scroll-under-modal-dialog`, `accessible-error-announcement`, `required-field-feedback`, `responsive-table`) and told B to read it in step 3.

So the trial tests whether those guides improve the screens. It does not test the skill's own search-and-pick flow.

## Result

| Screen | Run 1 | Rerun |
|---|---|---|
| settings | B | B |
| m-checkout | B | tie |
| d-logs | B | B |

One judge, blind, one run per variant per round. In run 1 the S copy lost every screen.

## Numbers

| | Before | A run 1 | B run 1 | A rerun | B rerun |
|---|---|---|---|---|---|
| Build | pass | pass | pass | pass | pass |
| JS gzip | 350.4 kB | 355.5 kB | 354.7 kB | 354.3 kB | 356.6 kB |
| CSS | 111.0 kB | 116.0 kB | 115.2 kB | 114.3 kB | 115.5 kB |
| Pipeline commits | - | 4 | 5 (6 incl. setup) | 4 | 5 |
| New packages | - | none | none | none | none |

Tokens and wall time: not recorded.

## Planted slop (run 1, grep-level read, not line by line)

Both variants removed the hardcoded colours, arbitrary px values, emoji icons, clickable `div`s and `outline-none` without a replacement, and both added labels, validation and a delete confirmation.

| Defect | A | B |
|---|---|---|
| DL5 command palette | Escape, autofocus, filter and Enter on first match; no arrow keys, no focus trap | combobox and listbox with arrow keys, focus trap and focus restore in a shadcn Dialog |
| DL4 logs table at narrow width | not handled | stacked cards under 600 px |
| Delete dialog | confirmation | confirmation, initial focus on Cancel |
| Required fields | validation | validation plus `required` and `*` markers |

The rerun was not counted against the list.

## What this does and doesn't show

- B's MWG step was its own commit (`3b`, run 1: +36 −20 lines in 4 files). Most differences between A and B come from the earlier steps, so some of the win is probably run-to-run variation, the same kind the A-vs-A control (`trials/2026-11-10-aa-control`) showed. No A win in six screens, with one tie, is the only evidence that it is more than that.
- The effect size is unknown.
- Not tested: the skill's own search; whether `npx` works in an interactive session where the user approves it; the guides on a real app beyond this sandbox; light mode only.

## Cost

Bundled copy: 210 files, 2.4 MB. `design-pass` step 3 now downloads the CLI from npm (about 16 MB unpacked) on first use and needs network and a permission rule. If refused, `design-pass` skips the consult and says so.
