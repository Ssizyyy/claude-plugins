# ssizyyy-plugins

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace.

## design-stack

A frontend design workflow for **existing** apps. The main skill, `design-pass`, runs these in order on the screens you name:

1. `design-taste-frontend` for layout and states (keeping your palette and fonts), picking ready-made components from `ui-component-catalog` before hand-building,
2. `break-ui` to stress the screen with worst-case data,
3. `impeccable` polish, then audit,
4. optional animated control motion (it asks first; see below),
5. before/after proof.

The order came from blind A/B trials on one desktop app (Tauri + React + shadcn), judged by one person. It is a strong default, not a law.

`ui-component-catalog` is a catalog of 530+ shadcn-registry components from useLayouts, ui-layouts and beUI, plus css-loaders notes: what each is good for, which were used, adopted or rejected and why, and how to install or recreate them. `design-pass` uses it, and it also triggers on its own before any UI work. To record a new decision, edit its `catalog/curated.json` in this repo, run `node scripts/refresh.mjs` from the skill folder, and release a new version.

Also included, invoke-by-name only (they never trigger on their own): Emil Kowalski's motion skills (`animate`, `emil-design-eng`, `animation-performance`, `animation-vocabulary`, `improve-animations`, `find-animation-opportunities`, `review-animations`), `pick-ui-library`, and Anthropic's `frontend-design` (the better pick for login, onboarding and landing pages).

### Install

Register the marketplace once, then install the plugin where you want it:

```bash
claude plugin marketplace add Ssizyyy/claude-plugins

# only in one project (recommended: the plugin adds a small always-on token cost)
claude plugin install design-stack@ssizyyy-plugins --scope project

# or in every project
claude plugin install design-stack@ssizyyy-plugins --scope user
```

Restart the session, then:

```
/design-stack:design-pass the Settings and Orders screens
```

Every skill is namespaced, for example `/design-stack:break-ui` or `/design-stack:frontend-design`.

### Share it with a team

`claude plugin install ... --scope project` only records the plugin in `.claude/settings.json`. For teammates (or a fresh clone) to find the marketplace too, add it to the same file and commit it:

```json
{
  "extraKnownMarketplaces": {
    "ssizyyy-plugins": {
      "source": { "source": "github", "repo": "Ssizyyy/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "design-stack@ssizyyy-plugins": true
  }
}
```

Claude Code asks them to trust the folder first, then fetches the marketplace and plugin.

### Updating

Third-party marketplaces don't auto-update by default. Run `claude plugin update design-stack@ssizyyy-plugins`, or turn on auto-update for the marketplace in `/plugin`. New releases are picked up when the plugin's `version` changes.

### Animate UI is not bundled

The best-performing control-motion option in the trials was [Animate UI](https://animate-ui.com), but its license (MIT + Commons Clause) forbids redistributing it in a bundle. `design-pass` asks whether you want control motion and, if you do, tells you to run `npx skills add imskyleen/animate-ui` yourself.

### Licenses

The original work here (the `design-pass` and `ui-component-catalog` skills, the manifests and this documentation) is MIT. Bundled third-party skills keep their own licenses, listed in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and in each skill folder.
