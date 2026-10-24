import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { save } from "@/api"

const titles = ["Your store", "Plan", "Review"]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: "", email: "", plan: "growth" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const next = async () => {
    if (step === 0) {
      const e: Record<string, string> = {}
      if (!form.name.trim()) e.name = "Store name is required"
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email"
      setErrors(e)
      if (Object.keys(e).length) return
    }
    if (step === 2) {
      await save("onboarding")
      return setDone(true)
    }
    setStep(step + 1)
  }

  if (done)
    return (
      <main className="mx-auto max-w-md space-y-2 p-6">
        <h1 className="text-2xl font-semibold">You're all set</h1>
        <p className="text-gray-500">{form.name} is ready on the {form.plan} plan.</p>
      </main>
    )

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{titles[step]}</h1>
        <p className="text-sm text-gray-500">Step {step + 1} of 3</p>
      </div>
      <Progress value={((step + 1) / 3) * 100} />
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Store name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Contact email</Label>
            <Input id="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>
      )}
      {step === 1 && (
        <RadioGroup value={form.plan} onValueChange={(v) => set("plan", v)} className="space-y-2">
          {[["starter", "Starter, $0"], ["growth", "Growth, $29/mo"], ["scale", "Scale, $99/mo"]].map(([v, l]) => (
            <Label key={v} className="flex items-center gap-3 rounded border p-3">
              <RadioGroupItem value={v} /> {l}
            </Label>
          ))}
        </RadioGroup>
      )}
      {step === 2 && (
        <dl className="space-y-1 text-sm">
          <div>Store: {form.name}</div>
          <div>Email: {form.email}</div>
          <div>Plan: {form.plan}</div>
        </dl>
      )}
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        <Button onClick={next}>{step === 2 ? "Finish" : "Next"}</Button>
      </div>
    </main>
  )
}
