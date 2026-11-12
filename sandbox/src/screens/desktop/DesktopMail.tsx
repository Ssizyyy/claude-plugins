import { useState } from "react"
import { getMessages } from "@/api"
import { useAsync } from "@/useAsync"

const folders = ["📥 Inbox", "📤 Sent", "🗄️ Archive", "🗑️ Trash", "⭐ Starred"]

export default function DesktopMail() {
  const { data } = useAsync(getMessages)
  const [folder, setFolder] = useState("Inbox")
  const [open, setOpen] = useState("M-1")
  const list = (data ?? []).filter((m) => m.folder === folder)
  const msg = (data ?? []).find((m) => m.id === open)

  return (
    <div className="flex h-full gap-[10px] p-[10px]" style={{ background: "#f0f0ff" }}>
      <div className="w-1/3 rounded-xl bg-white p-[10px] shadow-md">
        <div className="text-center text-lg font-bold" style={{ color: "#6366f1" }}>Folders</div>
        {folders.map((f) => (
          <div key={f} className="mt-[6px] rounded-xl bg-white p-2 text-center text-sm shadow-md" onClick={() => setFolder(f.split(" ")[1])}>
            {f}
          </div>
        ))}
        <button className="mt-3 w-full rounded-xl py-2 text-sm font-bold text-white outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
          ✏️ Compose
        </button>
      </div>
      <div className="w-1/3 overflow-y-auto rounded-xl bg-white p-[10px] shadow-md">
        <div className="text-center text-lg font-bold" style={{ color: "#6366f1" }}>Messages</div>
        {list.map((m) => (
          <div key={m.id} className="mt-[6px] rounded-xl bg-white p-2 shadow-md" onClick={() => setOpen(m.id)}>
            <div className="text-sm font-bold whitespace-nowrap">{m.from} · {m.subject}</div>
            <div className="text-xs" style={{ color: "#bdbdbd" }}>{m.preview}</div>
            <div className="text-xs" style={{ color: "#bdbdbd" }}>{m.time}</div>
          </div>
        ))}
      </div>
      <div className="w-1/3 rounded-xl bg-white p-[10px] shadow-md">
        <div className="text-center text-lg font-bold" style={{ color: "#6366f1" }}>Reading</div>
        <div className="mt-[6px] rounded-xl bg-white p-3 shadow-md">
          <div className="text-center text-sm font-bold">{msg?.subject}</div>
          <div className="text-center text-xs" style={{ color: "#bdbdbd" }}>from {msg?.from} at {msg?.time}</div>
          <p className="mt-2 text-center text-sm">{msg?.preview} {msg?.preview}</p>
          <div className="mt-3 flex justify-center gap-1">
            {["Reply", "Reply all", "Forward", "Archive", "Delete"].map((b) => (
              <button key={b} className="rounded-xl px-2 py-1 text-xs font-bold text-white outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
