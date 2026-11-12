# Design system: polished area

design-pass mode: free

Applies to `#/polished/*` only. Tokens live in `src/polished/polished.css` under `.polished` (light) and `.polished.dark`. The thin screens (`#/dashboard` etc.) deliberately do not use them. Components for this area live in `src/polished/ui` and use semantic classes only.

## Personality

Calm and precise: cool neutrals, one deep teal accent, tight 8 px radius, quiet shadows. Dense app screens, nothing decorative.

## Palette roles

- **Surface**: `background` (page), `card`, `popover`. Cards sit one step above the page.
- **Text**: `foreground`, `muted-foreground` (secondary copy, labels, table meta).
- **Action**: `primary` (the one main action per view), `secondary` (quiet buttons), `accent` (hover, selected rows, active nav).
- **Status**: `success`, `warning`, `info` (tinted fill + matching `-foreground` text, used for badges), `destructive` (delete, errors).
- **Structure**: `border`, `input`, `ring` (focus).
- **Charts**: `chart-1` to `chart-5`, teal first.

Every text/surface pair is at least 4.5:1 in both modes (see the swatch page).

## Type

Geist Variable only. Scale: 12 captions and table meta, 14 body and controls, 16 lead, 20 card titles, 28 page titles, 40 display numbers. Money and counts use `tnum` (tabular figures).

## Spacing, radius, elevation

4 px grid via Tailwind spacing. Radius 8 px (`--radius`), 6 px on inner elements. Elevation: borders first, `--shadow-sm` for cards, `--shadow-md` for popovers and drawers only.

## Do and don't

- Do use semantic classes (`bg-card`, `text-muted-foreground`, `border`). Don't use raw palette classes or hex.
- Do keep one `primary` button per view. Don't tint status badges with `primary`.
- Do show loading, empty and error states. Don't rely on colour alone for status; pair it with text.
- Do respect `prefers-reduced-motion`.
