# claude-plugins

Public Claude Code marketplace `ssizyyy-plugins`. Everything committed here is public.

## Layout

- `plugins/<name>/`: one plugin each (`.claude-plugin/plugin.json`, `skills/`, `CHANGELOG.md`).
- `.claude-plugin/marketplace.json`: the published marketplace. `.claude-plugin/dev-marketplace.json`: `ssizyyy-dev`, the same plugins read in place from this working tree. List every new plugin in both.
- `sandbox/`: Vite + React + shadcn app with fixture data and deliberately thin tokens, for trying skills. Never shipped.
- `scripts/`: `check-private-names.mjs`, `sync-upstream.mjs` (pins in `upstream.json`), git hooks in `scripts/hooks/`.

## Rules

- **Version bump** on every change under `plugins/<name>/` (CHANGELOG-only edits excepted): installs only update when `version` changes. CI enforces it.
- **CHANGELOG entry** in `plugins/<name>/CHANGELOG.md` for every bump.
- **Private names** stay out: the repo is public. The pre-commit hook and CI scan for the names in the gitignored `.private-names`. Enable the hook once per clone: `git config core.hooksPath scripts/hooks`.
- **Invoke-only** (`disable-model-invocation: true`) for helper and third-party skills, unless a skill is the plugin's entry point or a step the entry point runs.
- **Third-party skills** change only through `node scripts/sync-upstream.mjs sync|bump <skill>`; add new ones to `upstream.json`. Every bundled third-party item gets a row in `THIRD-PARTY-NOTICES.md` with its pinned commit.

## Dev loop

Edit under `plugins/`, then restart the Claude session in `sandbox/` (or `/reload-plugins`); `sandbox/.claude/settings.json` enables `design-stack@ssizyyy-dev`, which loads the working tree directly. Run the app with `npm run dev` in `sandbox/`.
The marketplace path in that file is absolute; in a clone elsewhere, re-register it from `sandbox/`: `claude plugin marketplace add <clone>/.claude-plugin/dev-marketplace.json --scope project`.

## PR flow

Branch → PR → merge. Merge only once the last push shows in the PR and CI is green.
