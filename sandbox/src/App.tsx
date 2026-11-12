import { useEffect, useState, type ComponentType } from "react"
import { cn } from "@/lib/utils"
import Dashboard from "@/screens/Dashboard"
import Orders from "@/screens/Orders"
import Settings from "@/screens/Settings"
import Login from "@/screens/Login"
import Landing from "@/screens/Landing"
import Products from "@/screens/Products"
import Customers from "@/screens/Customers"
import Analytics from "@/screens/Analytics"
import Onboarding from "@/screens/Onboarding"
import Pricing from "@/screens/Pricing"
import Notifications from "@/screens/Notifications"
import MobileFeed from "@/screens/mobile/MobileFeed"
import MobileDetail from "@/screens/mobile/MobileDetail"
import MobileCheckout from "@/screens/mobile/MobileCheckout"
import DesktopMail from "@/screens/desktop/DesktopMail"
import DesktopLogs from "@/screens/desktop/DesktopLogs"
import DesktopPrefs from "@/screens/desktop/DesktopPrefs"
import Polished from "@/polished/Polished"

// Hash routing keeps the sandbox dependency-free: #/dashboard, #/orders, ...
// slop: the screen is a deliberately careless first draft, the fixed input for skill trials (see trials/).
// frame: the shell draws a phone (390 x 844) or a desktop window around the screen; the screen fills it.
type Screen = { label: string; Component: ComponentType; slop?: boolean; frame?: "phone" | "window" }
const screens: Record<string, Screen> = {
  dashboard: { label: "Dashboard", Component: Dashboard },
  orders: { label: "Orders", Component: Orders, slop: true },
  settings: { label: "Settings", Component: Settings, slop: true },
  login: { label: "Login", Component: Login, slop: true },
  landing: { label: "Landing", Component: Landing },
  products: { label: "Products", Component: Products },
  customers: { label: "Customers", Component: Customers },
  analytics: { label: "Analytics", Component: Analytics },
  onboarding: { label: "Onboarding", Component: Onboarding },
  pricing: { label: "Pricing", Component: Pricing },
  feedback: { label: "Feedback", Component: Notifications },
  "m-feed": { label: "Feed", Component: MobileFeed, slop: true, frame: "phone" },
  "m-detail": { label: "Detail", Component: MobileDetail, slop: true, frame: "phone" },
  "m-checkout": { label: "Checkout", Component: MobileCheckout, slop: true, frame: "phone" },
  "d-mail": { label: "Mail", Component: DesktopMail, slop: true, frame: "window" },
  "d-logs": { label: "Logs", Component: DesktopLogs, slop: true, frame: "window" },
  "d-prefs": { label: "Preferences", Component: DesktopPrefs, slop: true, frame: "window" },
  polished: { label: "Polished", Component: Polished },
}

const current = () => {
  const k = location.hash.replace(/^#\/?/, "").split("?")[0].split("/")[0]
  return k in screens ? k : "dashboard"
}

export default function App() {
  const [screen, setScreen] = useState(current)
  useEffect(() => {
    const on = () => setScreen(current())
    addEventListener("hashchange", on)
    return () => removeEventListener("hashchange", on)
  }, [])
  const { Component, frame, label } = screens[screen]

  return (
    <div className="min-h-screen">
      {screen !== "polished" && <nav className={cn("flex flex-wrap gap-1 border-b px-4 py-2 text-sm", frame === "phone" && "max-[480px]:hidden")}>
        <span className="mr-4 font-semibold">Sandbox</span>
        {Object.keys(screens).map((k) => (
          <a
            key={k}
            href={`#/${k}`}
            className={cn("rounded px-2 py-1 text-gray-600 hover:bg-gray-100", k === screen && "bg-gray-100 text-gray-900")}
          >
            {screens[k].frame === "phone" ? "📱 " : screens[k].frame === "window" ? "🖥 " : ""}
            {screens[k].label}
            {screens[k].slop && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-800">slop</span>}
          </a>
        ))}
      </nav>}
      {frame === "phone" ? (
        <div className="flex justify-center bg-gray-200 p-6 max-[480px]:p-0">
          <div className="h-[860px] w-[406px] overflow-hidden rounded-[36px] border-8 border-gray-900 bg-white max-[480px]:h-screen max-[480px]:w-full max-[480px]:rounded-none max-[480px]:border-0">
            <Component />
          </div>
        </div>
      ) : frame === "window" ? (
        <div className="flex justify-center bg-gray-200 p-6">
          <div className="flex h-[720px] w-full max-w-[1120px] flex-col overflow-hidden rounded-lg border bg-white shadow-xl">
            <div className="flex h-8 flex-none items-center gap-1.5 border-b bg-gray-100 px-3 text-xs text-gray-600">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
              <span className="ml-2">{label}</span>
            </div>
            <div className="min-h-0 flex-1">
              <Component />
            </div>
          </div>
        </div>
      ) : (
        <Component />
      )}
    </div>
  )
}
