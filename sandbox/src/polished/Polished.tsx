import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/polished/ui/button"
import { cn } from "@/lib/utils"
import "@/polished/polished.css"
import Swatch from "@/polished/Swatch"

// Sub-routes of #/polished/<page>. Screens are added as they are built.
const pages: Record<string, { label: string; Component: () => React.ReactNode }> = {
  swatch: { label: "Swatch", Component: Swatch },
}

const sub = () => {
  const k = location.hash.replace(/^#\/?/, "").split("?")[0].split("/")[1] ?? "swatch"
  return k in pages ? k : "swatch"
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
  const { Component } = pages[page]

  return (
    <div className={cn("polished min-h-screen", dark && "dark")}>
      <header className="flex items-center gap-1 border-b px-4 py-2 text-sm">
        <a href="#/dashboard" className="mr-4 font-semibold">Sandbox</a>
        {Object.entries(pages).map(([k, p]) => (
          <a
            key={k}
            href={`#/polished/${k}`}
            className={cn("rounded-md px-2 py-1 text-muted-foreground hover:bg-muted", k === page && "bg-muted text-foreground")}
          >
            {p.label}
          </a>
        ))}
        <Button variant="ghost" size="icon" className="ml-auto" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
          {dark ? <Sun /> : <Moon />}
        </Button>
      </header>
      <Component />
    </div>
  )
}
