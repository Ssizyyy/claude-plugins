# Third-party notices

This repository bundles skills written by other people. Each keeps its own license file inside its folder under `plugins/design-stack/skills/`. They are redistributed unmodified except for the front-matter change listed in the last column.

| Skill folder | Source | License | Changed here |
| --- | --- | --- | --- |
| `design-taste-frontend` | https://github.com/Leonxlnx/taste-skill (`skills/taste-skill`) | MIT | folder renamed from `taste-skill`; contents unchanged |
| `break-ui`, `pick-ui-library` | https://github.com/emilkowalski/skills (Emil Kowalski) | MIT | no (`pick-ui-library` is already invoke-only upstream) |
| `emil-design-eng`, `animate`, `animation-performance`, `animation-vocabulary`, `improve-animations`, `find-animation-opportunities` | https://github.com/emilkowalski/skills | MIT | added `disable-model-invocation: true` to the front matter |
| `review-animations` | https://github.com/emilkowalski/skills | MIT | no (already invoke-only upstream) |
| `impeccable` | https://github.com/pbakaus/impeccable (Paul Bakaus) | Apache-2.0 (see its LICENSE and NOTICE.md) | no |
| `frontend-design` | Anthropic's `frontend-design` skill (https://github.com/anthropics/skills) | Apache-2.0 (see its LICENSE.txt) | added `disable-model-invocation: true` to the front matter, marked with a comment in the file |

## Component metadata in `ui-component-catalog`

`ui-component-catalog/catalog/components.json` and `INDEX.md` include component names, titles, descriptions, dependency lists and install URLs taken from these public shadcn registries. No component source code is bundled; components are installed from their own registries.

| Source | Registry | License |
| --- | --- | --- |
| useLayouts | https://uselayouts.com | MIT |
| ui-layouts | https://ui-layouts.com (https://github.com/ui-layouts/uilayouts) | MIT |
| beUI | https://beui.dev | MIT |

`catalog/css-loaders.md` is original notes about https://css-loaders.com (Temani Afif) and contains no CSS from it.

## Not bundled: Animate UI

The Animate UI skill (https://github.com/imskyleen/animate-ui) is licensed MIT + Commons Clause, which forbids redistributing its components alone or in a bundle. It is therefore not included. `design-pass` tells you how to install it yourself.
