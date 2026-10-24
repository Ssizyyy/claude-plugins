import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/polished/ui/button"
import { cn } from "@/lib/utils"
import { Toaster } from "sileo"
import "sileo/styles.css"
import "@/polished/polished.css"
import Dashboard from "@/polished/Dashboard"
import Orders from "@/polished/Orders"
import Products from "@/polished/Products"
import Settings from "@/polished/Settings"
import Swatch from "@/polished/Swatch"

// Sub-routes of #/polished/<page>. Screens are added as they are built.
const pages: Record<string, { label: string; Component: () => React.ReactNode }> = {
  dashboard: { label: "Dashboard", Component: Dashboard },
  orders: { label: "Orders", Component: Orders },
  products: { label: "Products", Component: Products },
  settings: { label: "Settings", Component: Settings },
  swatch: { label: "Swatch", Component: Swatch },
}

const sub = () => {
  const k = location.hash.replace(/^#\/?/, "").split("?")[0].split("/")[1] ?? "dashboard"
  return k in pages ? k : "dashboard"
}

const saved = () => {
  try {
    return localStorage.getItem("polished-theme")
  } catch {
    return null
  }
}

export default function Polished() {
  const [page, setPage] = useState(sub)
  const [dark, setDark] = useState(() => (saved() ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark")
  useEffect(() => {
    const on = () => setPage(sub())
    addEventListener("hashchange", on)
    return () => removeEventListener("hashchange", on)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("polished-theme", dark ? "dark" : "light")
    } catch {}
  }, [dark])
  // Portals (toasts, dialogs) render outside the wrapper, so the scope classes go on <html> too.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add("polished")
    root.classList.toggle("dark", dark)
    return () => root.classList.remove("polished", "dark")
  }, [dark])
  const { Component } = pages[page]

  return (
    <div className={cn("polished min-h-screen", dark && "dark")}>
      <header className="flex items-center gap-1 overflow-x-auto border-b px-4 py-2 text-sm">
        <a href="#/dashboard" className="mr-4 shrink-0 font-semibold">Sandbox</a>
        {Object.entries(pages).map(([k, p]) => (
          <a
            key={k}
            href={`#/polished/${k}`}
            className={cn("shrink-0 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted pointer-coarse:py-3", k === page && "bg-muted text-foreground")}
          >
            {p.label}
          </a>
        ))}
        <Button variant="ghost" size="icon" className="ml-auto shrink-0 pointer-coarse:size-11" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
          {dark ? <Sun /> : <Moon />}
        </Button>
      </header>
      <Component />
      <Toaster position="top-right" theme={dark ? "dark" : "light"} options={{ fill: dark ? "oklch(0.24 0.018 235)" : "oklch(1 0 0)", styles: { title: "text-foreground!", description: "text-muted-foreground!" } }} />
    </div>
  )
}
