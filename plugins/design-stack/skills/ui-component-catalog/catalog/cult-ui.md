# Cult UI (cult-ui.com)

Repo nolly-studio/cult-ui, MIT: copy, modify and recreate freely. About 150 free components (the registry lists 307 entries because demos and illustrations are separate items; checked 2026-11-15). Not indexed in `components.json`; fetch `https://cult-ui.com/r/registry.json` and grep it.

Install: `npx shadcn@latest add https://www.cult-ui.com/r/<name>.json`, or register the namespace in `components.json` and add by name. The site also offers an MCP server.

Deps vary by item: `motion` (65), `@base-ui/react` (15), `@paper-design/shaders-react` (10), `react-use-measure`, `border-beam`, `cobe`, `geist`, `three` (1), `jotai`, `vaul`, `sonner`. 193 of 307 entries need none.

- **Fit**: Safe mode for the no-dep app items: `expandable`, `floating-panel`, `popover-form`, `direction-aware-tabs`, `sortable-list`, `color-picker`, `timer`. Free mode for shader heroes (`hero-dithering`, `hero-liquid-metal`, `hero-heatmap`), `three-d-carousel`, `globe`, Apple device mockups. Shader and three.js items are marketing-only.
- **App standouts**: `popover-form`, `floating-panel`, `expandable`, `dock`, `dynamic-island`, `kanban-board`, `analytics-chart`, `collab-toolbar`, `family-drawer`, `halo-*` form controls (input, select, switch, segmented, badge, progress, toast), generative-UI polls (`choice-poll`, `feature-voting`, `vote-tally`), AI inputs (`prompt-library`, `halo-search`).
- **Overlap**: tabs, popovers and inputs with beUI; shader backgrounds with React Bits. The `halo-*` family and the polls are new.
- Mixed icon sets (lucide, hugeicons, tabler) and fonts (`geist`): swap to the project's own. Reduced-motion guard on every moving item.
