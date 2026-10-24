import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  ["Orders in one place", "Every channel lands in a single list you can search and filter."],
  ["Payments that reconcile", "Refunds and failed payments show up next to the order they belong to."],
  ["Reports on Monday", "A weekly summary of revenue, orders and refunds in your inbox."],
]

const tiers = [
  ["Starter", "$0", "Up to 100 orders a month"],
  ["Growth", "$29", "Unlimited orders, 3 seats"],
  ["Scale", "$99", "Unlimited everything, SSO"],
]

export default function Landing() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Run your shop without the spreadsheets</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Acme Goods keeps orders, payments and customers together so you can spend less time on admin.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <a href="#/login">Start free trial</a>
          </Button>
          <Button size="lg" variant="outline">
            Book a demo
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-16 md:grid-cols-3">
        {features.map(([title, desc]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold">Pricing</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {tiers.map(([name, price, desc]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle>{name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {price}
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  </div>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-8 text-center text-sm text-gray-500">© 2026 Acme Goods</footer>
    </main>
  )
}
