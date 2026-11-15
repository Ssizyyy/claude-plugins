# SmoothUI (smoothui.dev)

Repo educlopez/smoothui, MIT: copy, modify and recreate freely. 229 components and 35 blocks in a shadcn registry (checked 2026-11-15). Not indexed in `components.json`; `https://smoothui.dev/r/registry.json` is 2.6 MB, so grep it, never print it.

Install: `npx shadcn@latest add @smoothui/<name>` (needs `"@smoothui": "https://smoothui.dev/r/{name}.json"` under `registries`) or `npx smoothui-cli add <name>`.

Deps: `motion` in 222 items (130 need only `motion`), `lucide-react` 74, `@base-ui/react` 31; one-offs `gsap` (`gooey-popover`), `popmotion`, `cmdk`, `react-day-picker`, `input-otp`, `react-tweet`. 37 items need nothing.

- **Fit**: best Safe-mode source of the three: most items need only `motion`. The docs ship accessibility and animation guidance.
- **Blocks (35)**: `cta-1..3`, `faq-1..4`, `features-1..3`, `footer-1..4`, `header-1..6`, `logo-cloud-1..4`, `pricing-1..3`, `stats-1..2`, `team-1..2`, `testimonials-1..3`, plus `chat-template`. Starting points, same rule as ui-layouts blocks: re-skin and rewrite copy.
- **Component standouts**: form patterns (`otp-slots`, `country-picker`, `duration-picker`, `float-input`, `animated-file-upload`, `animated-stepper`, `auth-form`), `file-tree`, `favicon-search`, `dock`, `breadcrumb`, `pagination`, `dynamic-island`, `siri-orb`.
- **Overlap**: blocks with ui-layouts and useLayouts; text animations with React Bits. Pickers and form patterns are new.
- Reduced-motion guard on every moving item; map colours to project tokens.
