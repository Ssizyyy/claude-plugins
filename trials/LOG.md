# Trial log

One row per trialled skill. A reject is retested only when its pinned commit changes. Reports live in `trials/<date>-<skill>/report.md`. How trials run: `.claude/skills/skill-trial/SKILL.md`.

| Date | Skill | Source | Commit | Slot | Verdict | Reason |
|---|---|---|---|---|---|---|
| 2026-11-10 | emil-design-eng + animate (dry run) | emilkowalski/skills | bundled at the `upstream.json` pin | Whole-screen step 2b | Dry run, no action | B won 3 of 3, but an A-vs-A control also swept 3-0 for one side, so the result is noise. See report. |
| 2026-11-11 | emil-design-eng + animate (rerun) | emilkowalski/skills | bundled at the `upstream.json` pin | Whole-screen step 2b | Reject for this slot | B won 1 of 3 on the rerun; the dry-run 3-0 was noise. See report. |
