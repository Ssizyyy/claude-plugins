# claude-plugins

Public Claude Code marketplace `ssizyyy-plugins`. Everything committed here is public.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the repo map, how `design-stack` works, the dev loop, third-party syncing, skill trials and catalog updates. The rules below apply to every change.

## Rules

- **Version bump** on every change under `plugins/<name>/` (CHANGELOG-only edits excepted): installs only update when `version` changes. CI enforces it.
- **CHANGELOG entry** in `plugins/<name>/CHANGELOG.md` for every bump.
- **Both marketplaces**: list every new plugin in `.claude-plugin/marketplace.json` and `.claude-plugin/dev-marketplace.json`.
- **Private names** stay out: the repo is public. The pre-commit hook and CI scan for the names in the gitignored `.private-names`. Enable the hook once per clone: `git config core.hooksPath scripts/hooks`.
- **Invoke-only** (`disable-model-invocation: true`) for helper and third-party skills, unless a skill is the plugin's entry point or a step the entry point runs.
- **Third-party skills** change only through `node scripts/sync-upstream.mjs sync|bump <skill>`; add new ones to `upstream.json`. Every bundled third-party item gets a row in `THIRD-PARTY-NOTICES.md` with its pinned commit.
- **Sandbox** (`sandbox/`) is never shipped. Screens tagged `slop` in `sandbox/src/App.tsx` are deliberately careless first drafts, the fixed input for skill trials: don't clean them up on main.
- **Skill trials**: a skill joins `design-stack` only after a logged adopt in `trials/LOG.md`.
- **PR flow**: branch → PR → merge. Merge only once the last push shows in the PR and CI is green.
