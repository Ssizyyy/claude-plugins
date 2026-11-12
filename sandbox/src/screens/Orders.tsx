import { useState } from "react"
import { getOrders } from "@/api"
import type { Status } from "@/fixtures"
import { useAsync } from "@/useAsync"

const status: Record<Status, [string, string, string]> = {
  paid: ["✅", "#bbf7d0", "#86efac"],
  pending: ["⏳", "#fef9c3", "#fde047"],
  refunded: ["↩️", "#f3f4f6", "#d1d5db"],
  failed: ["❌", "#fee2e2", "#fca5a5"],
}

export default function Orders() {
  const { data } = useAsync(getOrders)
  const [q, setQ] = useState("")
  const rows = (data ?? []).filter((o) => `${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className="mx-auto max-w-6xl p-[22px] text-center">
      <h1 className="bg-clip-text text-4xl font-extrabold text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }}>
        🛒 Orders Dashboard
      </h1>
      <p className="text-4xl font-extrabold">Manage everything in one place ✨</p>
      <div className="mt-[13px] flex justify-center gap-[5px]">
        {["New order", "Export", "Import", "Refresh", "Bulk edit"].map((b) => (
          <button key={b} className="rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-lg outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            {b}
          </button>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search" className="mt-[9px] w-40 rounded-2xl border px-3 py-1 text-center text-xs outline-none placeholder:text-gray-300" />
      <div className="mt-[17px] rounded-2xl bg-white p-4 shadow-lg">
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                {["Order", "Customer", "Email", "Date", "Status", "Total"].map((h) => (
                  <th key={h} className="p-[7px]" style={{ color: "#6366f1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="p-[7px] font-bold">{o.id}</td>
                  <td className="p-[7px] font-bold">{o.customer}</td>
                  <td className="p-[7px] font-bold whitespace-nowrap">{o.email}</td>
                  <td className="p-[7px] font-bold">{o.date}</td>
                  <td className="p-[7px]">
                    <span className="rounded-2xl px-2 py-1 font-bold shadow-lg" style={{ background: status[o.status][1], color: status[o.status][2] }}>
                      {status[o.status][0]} {o.status}
                    </span>
                  </td>
                  <td className="p-[7px] font-bold">${o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
