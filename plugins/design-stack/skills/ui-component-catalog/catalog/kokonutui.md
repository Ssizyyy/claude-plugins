# Kokonut UI (kokonutui.com)

Repo kokonut-labs/kokonutui, MIT: copy, modify and recreate freely. About 116 components in a shadcn registry (checked 2026-11-15). Not indexed in `components.json`; fetch `https://kokonutui.com/r/registry.json` and grep it. The site also sells PRO templates and a few PRO components (slash command menu, image-generation card, two hero sections). Those are not in the public registry: do not recreate them.

Install: `npx shadcn@latest add @kokonutui/<name>` (needs `"@kokonutui": "https://kokonutui.com/r/{name}.json"` under `registries`), or `npx shadcn@latest add https://kokonutui.com/r/<name>.json`.

Deps: `motion` in 69 items, `lucide-react` in 65, `class-variance-authority` in 3. 42 items need nothing extra. No GSAP or three.js.

- **Fit**: Safe mode for the 42 no-dep items and, if the project already has `motion`, most of the rest. Free mode for everything.
- **Strongest family**: AI and agent UI (27): `ai-prompt`, `ai-tool-approval`, `ai-tool-calls`, `ai-citations`, `ai-diff-review`, `ai-model-selector`, `ai-agent-lanes`, `ai-message-queue`, `ai-context-meter`, `ai-inline-edit`. Fills the gap next to beUI's `prompt-input` and `agent-activity`.
- **Other standouts**: `slide-to-confirm`, `promise-toast`, `inline-alert`, `empty-state`, `save-status`, `wheel-picker`, `spending-ring`, `uptime-card`, `metric-card`, `seat-map`, `timezone-planner`.
- **Marketing/showpiece, use sparingly**: canvas and shader backgrounds (`dot-field`, `flow-field`, `topo-background`, `caustics-background`, `rain-glass-background`), text effects (`glitch-text`, `plucked-text`, `swoosh-text`).
- **Overlap**: AI chat items with beUI; text effects and backgrounds with React Bits. Commerce and feedback items are new.
- Every moving item needs the reduced-motion guard (see SKILL.md rules). Map colours to project tokens.
