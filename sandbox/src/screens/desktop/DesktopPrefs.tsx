import { useState } from "react"
import { save } from "@/api"
import { user } from "@/fixtures"

const sections = ["⚙️ General", "🎨 Appearance", "🔔 Notifications", "⌨️ Shortcuts", "🔐 Privacy", "🧪 Advanced"]
const toggles = ["Launch at login", "Check for updates automatically", "Send anonymous usage data", "Show unread count in the title bar", "Play a sound for new orders"]

export default function DesktopPrefs() {
  const [section, setSection] = useState(sections[0])
  const [on, setOn] = useState<Record<string, boolean>>({ "Launch at login": true })

  return (
    <div className="flex h-full" style={{ background: "#faf5ff" }}>
      <div className="w-44 p-[12px] text-center">
        {sections.map((s) => (
          <div key={s} onClick={() => setSection(s)} className="mb-[5px] rounded-2xl bg-white p-2 text-sm font-bold shadow-lg" style={{ color: s === section ? "#8b5cf6" : "#bdbdbd" }}>
            {s}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-[18px] text-center">
        <div className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>{section}</div>
        <div className="text-2xl font-bold">Make it yours ✨</div>
        <div className="mx-auto mt-[11px] max-w-md rounded-2xl bg-white p-4 shadow-lg">
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            <input defaultValue={user.name} className="w-full rounded-2xl border px-3 py-1 text-center text-sm outline-none" style={{ borderColor: "#e9d5ff" }} />
            <input defaultValue={user.email} className="mt-[5px] w-full rounded-2xl border px-3 py-1 text-center text-sm outline-none" style={{ borderColor: "#e9d5ff" }} />
            <select className="mt-[5px] w-full rounded-2xl border px-3 py-1 text-center text-sm outline-none" style={{ borderColor: "#e9d5ff" }}>
              <option>English (United States)</option>
              <option>Deutsch</option>
              <option>فارسی</option>
            </select>
          </div>
          <div className="mt-[9px] rounded-2xl bg-white p-3 shadow-lg">
            {toggles.map((t) => (
              <div key={t} className="mt-[3px] text-sm" onClick={() => setOn({ ...on, [t]: !on[t] })} style={{ color: on[t] ? "#8b5cf6" : "#c4c4c4" }}>
                {on[t] ? "✅" : "⬜"} {t}
              </div>
            ))}
          </div>
          <div className="mt-[13px] flex justify-center gap-1">
            {["Save", "Apply", "OK", "Reset", "Cancel"].map((b) => (
              <button key={b} onClick={() => save(b)} className="rounded-2xl px-3 py-1 text-xs font-bold text-white shadow-lg outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
