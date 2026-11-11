import { useState } from "react"
import { save } from "@/api"

const steps = ["📦 Shipping", "💳 Payment", "✅ Review"]
const fields = [
  ["Full name", "Street address", "City", "Postal code", "Country"],
  ["Card number", "Name on card", "Expiry (MM/YY)", "CVC"],
]

export default function MobileCheckout() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const next = () => {
    if (step < 2) return setStep(step + 1)
    save("order").then(() => setDone(true))
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "linear-gradient(180deg,#eef2ff,#faf5ff)" }}>
      <div className="p-[15px] text-center">
        <div className="text-lg font-bold" style={{ color: "#6366f1" }}>🛒 Checkout</div>
        <div className="mt-[6px] flex justify-center gap-[9px]">
          {steps.map((s) => (
            <span key={s} className="text-[11px] font-bold" style={{ color: "#6366f1" }}>{s}</span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-[15px]">
        <div className="rounded-2xl bg-white p-[13px] shadow-lg">
          {done ? (
            <div className="text-center text-sm font-bold">🎉 Order placed!</div>
          ) : step < 2 ? (
            <div className="space-y-[7px]">
              {fields[step].map((f) => (
                <input
                  key={f}
                  placeholder={f}
                  value={values[f] ?? ""}
                  onChange={(e) => setValues({ ...values, [f]: e.target.value })}
                  className="w-full rounded-2xl border px-3 py-[5px] text-xs outline-none placeholder:text-gray-300"
                  style={{ borderColor: "#e9e5ff" }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-3 text-center shadow-lg">
              <div className="text-xs font-bold">Selvedge Denim Jacket × 1</div>
              <div className="text-xs font-bold">Shipping: FREE 🎁</div>
              <div className="text-xs font-bold">Total: $178.00</div>
              <div className="mt-1 text-[10px] break-all" style={{ color: "#c4c4c4" }}>
                Ships to {values["Full name"]}, {values["Street address"]}, {values["City"]} {values["Postal code"]}, {values["Country"]}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-[15px] text-center">
        <button onClick={next} className="w-full rounded-2xl py-2 text-sm font-bold text-white shadow-lg outline-none" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
          {step < 2 ? "Continue →" : "Place order 🚀"}
        </button>
        <button onClick={() => setStep(Math.max(step - 1, 0))} className="mt-[4px] text-[9px] outline-none" style={{ color: "#c4c4c4" }}>
          back
        </button>
      </div>
    </div>
  )
}
