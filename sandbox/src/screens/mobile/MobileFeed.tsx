import { getProducts } from "@/api"
import { useAsync } from "@/useAsync"

const tabs = [
  ["🏠", "Home"],
  ["🔍", "Search"],
  ["🛒", "Cart"],
  ["❤️", "Saved"],
  ["👤", "Me"],
]

export default function MobileFeed() {
  const { data } = useAsync(getProducts)
  const items = data ?? []

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="px-[13px] pt-[22px] pb-[9px] text-center text-white" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
        <div className="font-bold" style={{ fontSize: 22 }}>✨ Discover ✨</div>
        <div style={{ fontSize: 11, color: "#e0e7ff" }}>Handpicked goods just for you</div>
        <input placeholder="Search..." className="mt-[7px] w-full rounded-2xl bg-white/30 px-3 py-1 text-xs text-white outline-none placeholder:text-white/60" />
      </header>
      <div className="flex-1 space-y-[11px] overflow-y-auto p-[13px]">
        {items.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-3 shadow-lg">
            <div className="rounded-2xl bg-white p-2 shadow-lg">
              <div className="flex h-24 items-center justify-center rounded-2xl text-4xl" style={{ background: "#ede9fe" }}>🛍️</div>
            </div>
            <div className="mt-2 text-center font-bold whitespace-nowrap">{p.name}, from the {p.category} Collection</div>
            <div className="text-center" style={{ color: "#b4b4b4", fontSize: 11 }}>⭐ {p.rating} · {p.stock} in stock</div>
            <div className="text-center font-bold" style={{ color: "#6366f1" }}>${p.price}</div>
            <div className="mt-2 flex justify-center gap-1">
              {["Buy now", "Add to cart", "Save"].map((b) => (
                <button key={b} className="rounded-2xl px-3 py-1 text-xs font-bold text-white shadow-lg outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <nav className="flex justify-around border-t py-[3px]">
        {tabs.map(([icon, label], i) => (
          <button key={label} className="flex flex-col items-center outline-none" style={{ fontSize: 9, color: i === 0 ? "#6366f1" : "#b4b4b4" }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
