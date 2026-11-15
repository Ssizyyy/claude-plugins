# Sandbox

A small Vite + React + shadcn app for trying `design-stack` skills on real screens. It is never shipped. It has no backend: screens read fixtures (`src/fixtures.ts`) through a fake async API (`src/api.ts`).

## Run it

```bash
npm install
npm run dev
```

Screens use hash routes: `#/dashboard`, `#/orders`, `#/settings`, `#/login`, and so on. The nav bar lists them all.

## Two areas

| Area | Routes | Tokens |
| --- | --- | --- |
| Thin screens | Everything in the nav except Polished (`src/screens/`) | Deliberately thin, so skills have something to fix |
| Polished | `#/polished/*` (`src/polished/`) | A full design system built with `design-pass`, described in `DESIGN.md` |

Keep the thin screens thin on `main`. They are the shared starting point for trying skills, so try a skill on a branch or in a worktree and throw the result away or keep it there.

## Loading the plugin from this repo

`.claude/settings.json` here enables `design-stack@ssizyyy-dev`, which reads the plugin from this working tree, so a Claude session started in this folder runs your local edits after `/reload-plugins`. See the Dev loop section in [CONTRIBUTING.md](../CONTRIBUTING.md).
