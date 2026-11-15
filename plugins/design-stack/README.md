# design-stack

Frontend design workflow for Claude Code. It redesigns or builds app screens in a fixed order: layout and states, stress test, polish. The mode is chosen by the skill you start.

## Install

```
/plugin marketplace add Ssizyyy/claude-plugins
/plugin install design-stack@ssizyyy-plugins
```

## Start here

| Command | Mode |
|---|---|
| `/design-stack:design-pass` | Safe: no new packages, no motion. Claude may start it for you. |
| `/design-stack:design-pass-free` | Free: new packages, WebGL and cursor effects allowed, control motion included. You start it. |
| `/design-stack:control-motion` | Animate UI on controls (about +40 kB JS). Runs inside Free, or by hand after a Safe pass. |

The full guide (pipeline, every skill, troubleshooting, evidence) is a published page; the link is added here once it is shared. Skill sources live in `skills/`; the shared procedure is `skills/design-pass/references/core.md`.
