import { useState } from "react"
import { getProducts } from "@/api"
import { useAsync } from "@/useAsync"

const sizes = ["XS", "S", "M", "L", "XL"]

export default function MobileDetail() {
  const { data } = useAsync(getProducts)
  const [sheet, setSheet] = useState(false)
  const [size, setSize] = useState("M")
  const [qty, setQty] = useState(1)
  const p = (data ?? [])[14]

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ background: "#f5f3ff" }}>
      <div className="flex items-center justify-between px-[11px] py-[6px]">
        <a href="#/m-feed" className="text-[10px]" style={{ color: "#b4b4b4" }}>‹ back</a>
        <span className="text-[10px]" style={{ color: "#b4b4b4" }}>share</span>
      </div>
      <div className="flex-1 overflow-y-auto p-[14px]">
        <div className="rounded-3xl bg-white p-4 text-center shadow-xl">
          <div className="rounded-3xl bg-white p-3 shadow-xl">
            <div className="flex h-44 items-center justify-center rounded-3xl text-6xl" style={{ background: "linear-gradient(135deg,#c7d2fe,#f5d0fe)" }}>🧥</div>
          </div>
          <div className="mt-[9px] text-xl font-bold">{p?.name}</div>
          <div className="text-xl font-bold" style={{ color: "#8b5cf6" }}>${p?.price}</div>
          <div className="text-xl font-bold">⭐ {p?.rating} rating</div>
          <p className="mt-[5px] text-xs" style={{ color: "#c4c4c4" }}>
            Cut from heavyweight selvedge denim and finished by hand. Wears in, not out. Free returns within 30 days on every order, no questions asked.
          </p>
          <div className="mt-3 rounded-3xl bg-white p-3 shadow-xl">
            <div className="text-xs font-bold">🚚 Free shipping</div>
            <div className="text-xs font-bold">🔒 Secure checkout</div>
            <div className="text-xs font-bold">💜 Loved by 2,000+ customers</div>
          </div>
        </div>
      </div>
      <div className="flex gap-[5px] p-[10px]">
        {["Add to cart", "Buy now", "Choose size"].map((b) => (
          <button key={b} onClick={() => setSheet(true)} className="flex-1 rounded-3xl py-2 text-xs font-bold text-white shadow-xl outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            {b}
          </button>
        ))}
      </div>
      {sheet && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-[17px] text-center shadow-xl">
          <div className="text-sm font-bold">Pick your size ✨</div>
          <div className="mt-2 flex justify-center gap-[3px]">
            {sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} className="h-6 w-6 rounded-full text-[9px] outline-none" style={{ background: s === size ? "#8b5cf6" : "#f5f3ff", color: s === size ? "#fff" : "#c4c4c4" }}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs">
            <button className="h-5 w-5 rounded-full outline-none" style={{ background: "#f5f3ff" }} onClick={() => setQty(qty - 1)}>-</button>
            {qty}
            <button className="h-5 w-5 rounded-full outline-none" style={{ background: "#f5f3ff" }} onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button className="mt-3 w-full rounded-3xl py-2 text-xs font-bold text-white outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            Add {qty} to cart · ${(p?.price ?? 0) * qty}
          </button>
        </div>
      )}
    </div>
  )
}
