import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import Dashboard from "@/screens/Dashboard"
import Orders from "@/screens/Orders"
import Settings from "@/screens/Settings"
import Login from "@/screens/Login"
import Landing from "@/screens/Landing"

// Hash routing keeps the sandbox dependency-free: #/dashboard, #/orders, ...
const screens = {
  dashboard: { label: "Dashboard", Component: Dashboard },
  orders: { label: "Orders", Component: Orders },
  settings: { label: "Settings", Component: Settings },
  login: { label: "Login", Component: Login },
  landing: { label: "Landing", Component: Landing },
}
type Key = keyof typeof screens

const current = (): Key => {
  const k = location.hash.replace(/^#\/?/, "")
  return k in screens ? (k as Key) : "dashboard"
}

export default function App() {
  const [screen, setScreen] = useState<Key>(current)
  useEffect(() => {
    const on = () => setScreen(current())
    addEventListener("hashchange", on)
    return () => removeEventListener("hashchange", on)
  }, [])
  const { Component } = screens[screen]

  return (
    <div className="min-h-screen">
      <nav className="flex gap-1 border-b px-4 py-2 text-sm">
        <span className="mr-4 font-semibold">Sandbox</span>
        {(Object.keys(screens) as Key[]).map((k) => (
          <a
            key={k}
            href={`#/${k}`}
            className={cn("rounded px-2 py-1 text-gray-600 hover:bg-gray-100", k === screen && "bg-gray-100 text-gray-900")}
          >
            {screens[k].label}
          </a>
        ))}
      </nav>
      <Component />
    </div>
  )
}
