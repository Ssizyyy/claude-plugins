---
name: design-pass-free
description: design-pass in Free mode, started by the user only. Same pipeline as design-pass, but with no dependency lock (new packages, WebGL and cursor effects allowed) and with control motion run automatically. Use for /design-stack:design-pass-free.
disable-model-invocation: true
---

# Design pass (Free)

Mode: **Free**. Do not ask which mode to use. No dependency lock; heavy catalog items and cursor effects are allowed; control motion runs in step 4. The reduced-motion fallback is still required. Report every added package and heavy effect with a one-line cost (size, fallback).

Read `../design-pass/references/core.md` (relative to this skill's base directory) and follow it with mode Free.
