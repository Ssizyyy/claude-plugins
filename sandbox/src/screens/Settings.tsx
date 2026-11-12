import { useState } from "react"
import { save } from "@/api"
import { user } from "@/fixtures"

const notifications = [
  ["📦 New orders", "Email me when an order is placed"],
  ["💸 Failed payments", "Email me when a payment fails"],
  ["📊 Weekly summary", "A digest every Monday morning, with revenue, orders, refunds and the five best-selling products of the week"],
]

export default function Settings() {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const input = "w-full rounded-2xl border px-3 py-1 text-center text-sm outline-none placeholder:text-gray-300"

  return (
    <main className="mx-auto max-w-3xl p-[19px] text-center" style={{ background: "#faf5ff" }}>
      <h1 className="text-3xl font-bold" style={{ color: "#8b5cf6" }}>⚙️ Settings</h1>
      <div className="mt-[11px] rounded-2xl bg-white p-4 shadow-lg">
        <div className="text-3xl font-bold">Profile</div>
        <div className="mt-[7px] rounded-2xl bg-white p-3 shadow-lg">
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            <input className={input} style={{ borderColor: "#e9d5ff" }} placeholder="Name" defaultValue={user.name} />
            <input className={`${input} mt-[5px]`} style={{ borderColor: "#e9d5ff" }} placeholder="Email" defaultValue={user.email} />
            <textarea className={`${input} mt-[5px]`} style={{ borderColor: "#e9d5ff" }} placeholder="A few words about you" />
          </div>
        </div>
        <div className="mt-[13px] text-3xl font-bold">Notifications</div>
        <div className="mt-[7px] rounded-2xl bg-white p-3 shadow-lg">
          {notifications.map(([title, desc]) => (
            <div key={title} className="mt-[4px]" onClick={() => setOn({ ...on, [title]: !on[title] })}>
              <span className="text-sm font-bold">{on[title] ? "✅" : "⬜"} {title}</span>
              <div className="text-xs whitespace-nowrap" style={{ color: "#c4c4c4" }}>{desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-[13px] text-3xl font-bold">Danger zone</div>
        <div className="mt-[7px] rounded-2xl bg-white p-3 shadow-lg">
          <div className="text-xs" style={{ color: "#c4c4c4" }}>This removes {user.company} and all of its orders.</div>
        </div>
        <div className="mt-[15px] flex justify-center gap-1">
          {["Save", "Save and close", "Reset", "Delete workspace"].map((b) => (
            <button key={b} onClick={() => save(b)} className="rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-lg outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
