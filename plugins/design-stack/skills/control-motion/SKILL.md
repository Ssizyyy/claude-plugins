---
name: control-motion
description: Adds Animate UI expressive motion to controls (selection underlines, option tiles, press feedback, inline panels) on existing screens. Step 4 of design-pass-free, which runs it automatically; in Safe mode the user starts it on its own. Use for /design-stack:control-motion.
disable-model-invocation: true
---

# Control motion

Adds animated motion to the controls of the screens named in the args (or the conversation). It needs new dependencies (`@animate-ui/react`, `motion`, about 40 kB of JavaScript): if you were not started by `design-pass-free`, state that cost in one line and get a yes first.

The tested choice for control motion is **Animate UI at its expressive level**. It is not bundled here because its license (MIT + Commons Clause) forbids redistributing it, so install it yourself in the project:

1. `npx skills add imskyleen/animate-ui` (project scope), and add the `@animate-ui/react` and `motion` packages. This is the exception to Safe mode's no-installs lock; say so in the report.
2. Tell the skill the level up front: **expressive**. Its codemod (path A) only touches `components/ui/*` and does nothing for hand-built controls; use path B (import swap) or C (rules).
3. Pitfalls found in the trial:
   - Wrap each selection control in a `motion.div` with `layoutRoot`. Otherwise, if the page shifts after load (a skeleton replacing content), the shared-layout underline stays stranded at the old position.
   - Animated numbers must settle fast (well under 300 ms); a roughly 1 s settle on counts read at a glance felt slow.
   - Stagger rows only on the first load, never when a filter, search or sort changes what is visible.
   - Expect about +40 to +48 kB of JavaScript (about +15 to +17 kB gzip); the subtle level costs about +11 kB.

Finish with a typecheck, build and before/after screenshots in light and dark, and report the bundle size change.
