# CSS Loaders (css-loaders.com)

Source: https://css-loaders.com/ by Temani Afif. 600+ pure-CSS loaders, each a single `<div class="loader"></div>`. No React, no deps, no install command: click a loader on the site to copy its CSS. Licence not stated on the site; confirm before shipping. Random picker: https://random.css-loaders.com

Use for: loading/pending states in any stack (Vue, vanilla, CMS themes, static mockups). Fits where a shadcn component is overkill. Recreate by pasting the CSS and renaming `.loader`; map colours to project tokens (`currentColor`, `--color-primary-element`). Wrap in `@media (prefers-reduced-motion: reduce)` (slow it down or show a static state) and give the host element `role="status"` plus a visible or aria label in the page language.

Collections (`https://css-loaders.com/<slug>/`, count): classic 40, dots 50, bars 30, dots-bars 20, spinner 30, shapes 40, polygons 12, 3d 12, progress 20, wobbling 20, infinity 20, zig-zag 20, wavy 16, mechanic 12, filling 20, bouncing 12, squishy 12, glowing 12, rolling 10, flipping 20, growing 10, continuous 10, pulsing 10, arcade 10, hypnotic 20, square 11, circle 11, square-circle 10, colorful 20, nature 16, time 10, hungry 8, shuriken 10, dancers 10, moving 10, eyes 10, line 20, thin 10, cut 10, clones 20, arrow 10, blob 20, maze 10, factory 8.

Best for product UI: classic, spinner, dots, bars, progress, thin, line, pulsing. Marketing/novelty only: arcade, hungry, shuriken, dancers, eyes, nature, factory, hypnotic, colorful.

## Lessons from use
- Plain-CSS recreations of spinner, dots, bars, progress and pulsing work well on design canvases and static mockups.
- A product with a strong brand mark may replace them all with a custom logo loader. Keep skeleton rows and determinate progress bars anyway: they are placeholders and progress, not spinners.
