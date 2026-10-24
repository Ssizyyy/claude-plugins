import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
  { name: "Starter", price: "$0", features: ["1 store", "100 orders / month", "Email support"] },
  { name: "Growth", price: "$29", features: ["3 stores", "5,000 orders / month", "Analytics", "Priority support"], featured: true },
  { name: "Scale", price: "$99", features: ["Unlimited stores", "Unlimited orders", "Custom domains", "Dedicated manager"] },
]

const faq = [
  ["Can I change plans later?", "Yes. Upgrades apply immediately and downgrades at the end of the billing period."],
  ["Is there a free trial?", "Starter is free forever. Paid plans include a 14-day trial."],
  ["How do refunds work?", "Cancel within 30 days of a charge for a full refund, no questions asked."],
]

export default function Pricing() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">Simple pricing</h1>
        <p className="text-gray-500">Start free, grow when you're ready.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.featured ? "border-indigo-500" : ""}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <div className="text-3xl font-bold">{p.price}<span className="text-sm font-normal text-gray-500"> /mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1 text-sm">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Button className="w-full" variant={p.featured ? "default" : "outline"}>Choose {p.name}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Accordion type="single" collapsible>
        {faq.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  )
}
