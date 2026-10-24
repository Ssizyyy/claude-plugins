# Sileo (toasts)

https://sileo.aaryan.design, repo hiaaryan/sileo, MIT. Not a shadcn registry: install with `npm i sileo`. A physics-style toast for React (>=18). Depends on `motion` (a new package if the project has none).

```tsx
import { sileo, Toaster } from "sileo";
// once, in the root layout:
<Toaster position="top-right" />
// anywhere:
sileo.success({ title: "Saved" });
sileo.promise(save(), { loading: { title: "Saving" }, success: { title: "Saved" }, error: { title: "Failed" } });
```

- Types: `success`, `error`, `warning`, `info`, `loading`, `action` (a toast with a button: `button: { title, onClick }`).
- Options: `title`, `description`, `position` (6 values; `Toaster position` is the default), `duration` (`null` = stays), `icon`, `fill`, `roundness`, `styles` (class names for title, description, badge, button), `autopilot`.
- Use it only when the project has no toast library. If one exists (sonner, a shadcn toast), keep it. Map `fill` and `styles` to the project's tokens; do not keep its defaults.
- Its stylesheet has `prefers-reduced-motion` rules and the toasts sit in an `aria-live="polite"` region. Still test with reduced motion on, and do not let a toast carry the only copy of an error: show it in the UI too.
