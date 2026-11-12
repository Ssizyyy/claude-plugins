import { useEffect, useState } from "react"
import { getLogs } from "@/api"
import { useAsync } from "@/useAsync"

const icon = { info: "ℹ️", warn: "⚠️", error: "🔥", debug: "🐛" }
const color = { info: "#93c5fd", warn: "#fde047", error: "#fca5a5", debug: "#d4d4d4" }
const commands = ["Clear log", "Export as CSV", "Toggle follow", "Filter: errors only", "Open settings"]

export default function DesktopLogs() {
  const { data } = useAsync(getLogs)
  const [q, setQ] = useState("")
  const [palette, setPalette] = useState(false)
  const rows = (data ?? []).filter((l) => l.message.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setPalette(true)
      }
    }
    addEventListener("keydown", on)
    return () => removeEventListener("keydown", on)
  }, [])

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-[7px] p-[9px]" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7)" }}>
        <span className="font-bold text-white" style={{ fontSize: 17 }}>📜 Logs</span>
        {["Follow", "Pause", "Clear", "Export", "Filter", "Settings"].map((b) => (
          <button key={b} className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-md outline-none" style={{ color: "#6366f1" }}>
            {b}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search" className="w-24 rounded-full bg-white/30 px-2 py-1 text-xs text-white outline-none placeholder:text-white/60" />
        <button onClick={() => setPalette(true)} className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-md outline-none" style={{ color: "#6366f1" }}>
          ⌘K
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-[9px]">
        <table style={{ fontSize: 11, fontFamily: "monospace" }}>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="px-[5px] py-[1px]">{l.time}</td>
                <td className="px-[5px] py-[1px]" style={{ color: color[l.level] }}>{icon[l.level]} {l.level}</td>
                <td className="px-[5px] py-[1px]" style={{ color: "#c4c4c4" }}>{l.source}</td>
                <td className="px-[5px] py-[1px] whitespace-nowrap">{l.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {palette && (
        <div className="absolute top-16 left-1/2 w-72 -translate-x-1/2 rounded-2xl bg-white p-3 text-center shadow-2xl">
          <div className="rounded-2xl bg-white p-2 shadow-md">
            <input placeholder="Type a command..." className="w-full text-center text-sm outline-none" />
          </div>
          {commands.map((c) => (
            <div key={c} className="mt-1 text-sm" onClick={() => setPalette(false)}>
              ✨ {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
