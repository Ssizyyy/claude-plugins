import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { channels, monthly } from "@/fixtures"

export default function Analytics() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ revenue: { label: "Revenue", color: "#6366f1" } }} className="h-64 w-full">
            <AreaChart data={monthly}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="revenue" stroke="#6366f1" fill="#c7d2fe" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ orders: { label: "Orders", color: "#f97316" } }} className="h-56 w-full">
              <BarChart data={channels}>
                <XAxis dataKey="channel" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="#f97316" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ orders: { label: "Orders", color: "#22c55e" } }} className="h-56 w-full">
              <BarChart data={monthly}>
                <XAxis dataKey="month" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="#22c55e" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
