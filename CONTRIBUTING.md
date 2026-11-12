# Maintaining this repo

This repo is the public Claude Code marketplace `ssizyyy-plugins`. It currently ships one plugin, `design-stack`. The [README](README.md) covers installing and using it. This file covers how the repo works and how to change it. Everything committed here is public.

## Repo map

| Path | What it is | Ships to users? |
| --- | --- | --- |
| `plugins/design-stack/` | The plugin: `.claude-plugin/plugin.json` (name, version), `skills/` (one folder per skill), `CHANGELOG.md` | Yes |
| `.claude-plugin/marketplace.json` | The published marketplace that `claude plugin marketplace add Ssizyyy/claude-plugins` reads | Yes |
| `.claude-plugin/dev-marketplace.json` | `ssizyyy-dev`, the same plugins read in place from this working tree, for local testing | No |
| `upstream.json` | Pinned upstream commits for every bundled third-party skill | No |
| `THIRD-PARTY-NOTICES.md` | Source, pinned commit, license and local changes for every bundled third-party item | No (read on GitHub) |
| `sandbox/` | Vite + React + shadcn app with fixture data, for trying skills. See [sandbox/README.md](sandbox/README.md) | No |
| `trials/` | `LOG.md` (every trialled skill and its verdict), `SLOP.md` (the defects planted in the slop screens), one folder per trial with its `report.md` | No |
| `.claude/skills/skill-trial/` | The `/skill-trial` skill that runs a trial | No |
| `scripts/` | Repo tooling: `sync-upstream.mjs`, `check-version-bump.mjs`, `check-private-names.mjs`, `skill-trial.mjs`, git hooks in `scripts/hooks/` | No |
| `.github/workflows/checks.yml` | CI | No |
| `CLAUDE.md` | The hard rules for agents working here; it points back to this file | No |

Only what the marketplace's `source` points at (`./plugins/design-stack`) reaches users.

## How design-stack works

`design-pass` is the entry point. It redesigns existing screens, or builds new ones after an interview, by running other skills in this plugin in a fixed order:

| Step | Skill | Layer it owns |
| --- | --- | --- |
| Intake (new screens only) | `grilling` if installed, else inline | Interview, then a plan table the user approves before anything is built |
| 0. Lock, prepare, ask | none | Lock tokens, fonts, dependencies and behaviour; offer a design system if tokens are thin; ask Safe or Free mode; add a fixture fallback; screenshot the before |
| 1. Layout and states | `design-taste-frontend` | Composition, hierarchy, loading/empty/error states; picks components from `ui-component-catalog` |
| 2. Stress | `break-ui` | Worst-case data |
| 3. Finish | `impeccable` (polish, then audit), consulting `modern-web-guidance` before fixing a control | Detail and accessibility |
| 4. Motion (opt-in) | Animate UI, installed by the user | Control motion; not bundled because of its license |
| 5. Prove it | none | Typecheck, build, before/after screenshots |

Login, onboarding and landing pages swap step 1 for `frontend-design`, which beat the whole stack on a login page.

The order came from blind A/B trials, summarised in the Evidence section of `plugins/design-stack/skills/design-pass/SKILL.md`. Read that before reordering steps or adding one.

Claude can pick up `design-pass`, the skills it runs (`design-taste-frontend`, `break-ui`, `impeccable`), `ui-component-catalog` and `reactbits-tools` on its own. Emil Kowalski's motion skills, `pick-ui-library`, `frontend-design` and `modern-web-guidance` are invoke-only (`disable-model-invocation: true` in the front matter) and run only when a user names them. New helper or third-party skills default to invoke-only unless `design-pass` runs them, because every model-invocable skill adds its description to every session's context.

## Release loop

1. Branch from `main`.
2. Edit under `plugins/design-stack/`.
3. Bump `version` in `plugins/design-stack/.claude-plugin/plugin.json`. Installs only update when it changes. Edits that touch only `CHANGELOG.md` are exempt.
4. Add an entry to `plugins/design-stack/CHANGELOG.md`.
5. Open a PR. Merge once the last push shows in the PR and CI is green.

CI (`.github/workflows/checks.yml`) runs on every PR:

| Job | Fails when |
| --- | --- |
| `validate` | `claude plugin validate` rejects either marketplace or a plugin, or the two marketplaces don't both list every folder in `plugins/` |
| `version-bump` | A plugin's files changed but its `version` didn't (`scripts/check-version-bump.mjs`) |
| `private-names` | A tracked file contains a name from the `PRIVATE_NAMES` secret (`scripts/check-private-names.mjs`) |

The same private-name check runs locally as pre-commit and commit-msg hooks, reading the gitignored `.private-names` file (one name per line). Enable the hooks once per clone:

```bash
git config core.hooksPath scripts/hooks
```

A new plugin needs a folder under `plugins/` and an entry in both `marketplace.json` and `dev-marketplace.json`.

## Dev loop

`sandbox/.claude/settings.json` enables `design-stack@ssizyyy-dev`, which loads the plugin straight from this working tree, and turns off the published copy.

1. Edit under `plugins/`.
2. In a Claude session started in `sandbox/`, run `/reload-plugins`, or restart the session.
3. Run the app with `npm run dev` in `sandbox/` and try the skill on a screen.

The marketplace path in that settings file is absolute. In a clone at another path, re-register it from `sandbox/`:

```bash
claude plugin marketplace add <clone>/.claude-plugin/dev-marketplace.json --scope project
```

## Third-party skills

Most skills in `design-stack` are copies of other people's skills, pinned in `upstream.json` by repo, path and commit. Never edit them by hand; a hand edit is lost on the next sync. Change them only with:

```bash
node scripts/sync-upstream.mjs sync [skill...]   # re-copy the pinned commits
node scripts/sync-upstream.mjs bump <skill...>   # move the pins to upstream HEAD, then sync
```

The script also applies the front-matter patches listed in `upstream.json` (mostly `disable-model-invocation: true`) and prints the git diff. To add a skill, add an entry to `upstream.json`, run `sync`, and add a row to `THIRD-PARTY-NOTICES.md` with its source, pinned commit, license and what changed. Check the license allows redistribution: Animate UI is left out because Commons Clause forbids it.

A sync changes files under `plugins/`, so it needs a version bump like any other change.

## Trialling a skill

A skill from the internet joins `design-stack` only after a logged adopt. `/skill-trial <owner/repo> [path]` (`.claude/skills/skill-trial/SKILL.md`) runs the trial:

1. `scripts/skill-trial.mjs fetch` pins the candidate to a commit under `trials/candidates/`, and you read it in full before anything runs.
2. It is checked for name and trigger collisions and for rules that contradict `design-pass`'s locks, then given a slot: challenger, new step, helper or reference.
3. `scripts/skill-trial.mjs setup` makes one git worktree per variant. A is the current pipeline; B is `design-pass` with the candidate in its slot. Each variant runs the design pass on the same screens in its own sub-session.
4. A blind side-by-side page (`judge`) shows the results unlabeled and you pick the winner per screen. A control that runs A against A shows how much noise the judging has.
5. The verdict (adopt, reject or park) goes in `trials/LOG.md` with a report under `trials/<date>-<skill>/`. A reject is retried only when the candidate's pinned commit changes.

The screens tagged `slop` in `sandbox/src/App.tsx` are deliberately careless first drafts and the fixed input for trials. `trials/SLOP.md` lists the defects planted in them, and the script deletes `trials/` inside every variant worktree so the skill under test never sees that list. Don't clean the slop screens up on `main`.

An adopted skill then follows the third-party steps above.

## Updating the component catalog

`ui-component-catalog` lists components from the useLayouts, ui-layouts, beUI and React Bits registries. `catalog/components.json` and `catalog/INDEX.md` are generated; `catalog/curated.json` holds the hand-written verdicts (used, adopted, rejected, and why).

1. Edit `plugins/design-stack/skills/ui-component-catalog/catalog/curated.json`.
2. From `plugins/design-stack/skills/ui-component-catalog/`, run `node scripts/refresh.mjs`. It refetches the public registries and regenerates both files, so it needs network access.
3. Bump the version and release as above.
