import { useCallback, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Avatar, AvatarFallback } from "@/polished/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/polished/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/polished/ui/chart"
import { Skeleton } from "@/polished/ui/skeleton"
import { activity, monthly, stats } from "@/fixtures"
import { loadOrders } from "@/polished/data"
import { ErrorState } from "@/polished/States"
import { StatusBadge, money } from "@/polished/StatusBadge"
import { useAsync } from "@/useAsync"

const ranges = { "3m": 3, "6m": 6, "12m": 12 } as const
type Range = keyof typeof ranges

const initials = (n: string) =>
  Array.from(n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => Array.from(p)[0])).join("") || "?"

export default function Dashboard() {
  const [range, setRange] = useState<Range>("12m")
  const orders = useAsync(useCallback(loadOrders, []))
  const data = useMemo(() => monthly.slice(-ranges[range]), [range])

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const down = s.change.startsWith("-")
          const good = s.label === "Refund rate" ? down : !down
          const Icon = down ? TrendingDown : TrendingUp
          return (
            <Card key={s.label} className="gap-2 py-4 shadow-[var(--shadow-sm)]">
              <CardHeader className="px-4">
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="tnum truncate text-3xl font-semibold">{s.value}</CardTitle>
              </CardHeader>
              <CardContent className={`flex items-center gap-1 px-4 text-xs ${good ? "text-success-foreground" : "text-destructive"}`}>
                <Icon className="size-3.5" aria-hidden />
                <span className="tnum">{s.change}</span>
                <span className="hidden text-muted-foreground sm:inline">vs last month</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-sm)] lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Monthly, last {ranges[range]} months</CardDescription>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList className="pointer-coarse:h-11">
                {Object.keys(ranges).map((r) => (
                  <TabsTrigger key={r} value={r}>{r}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }} className="h-64 w-full">
              <AreaChart data={data} margin={{ left: 4, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `$${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((a) => (
              <div key={a.what} className="flex items-center gap-3 text-sm">
                <Avatar>
                  <AvatarFallback>{initials(a.who)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="font-medium">{a.who}</span> {a.what}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.when}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle>Latest orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          )}
          {orders.error && <ErrorState message={orders.error} retry={orders.retry} />}
          {orders.data && (
            <ul className="divide-y">
              {orders.data.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 font-medium">{o.id}</span>
                  <span className="min-w-0 flex-1 truncate">{o.customer}</span>
                  <StatusBadge status={o.status} />
                  <span className="tnum w-28 shrink-0 text-right">{money(o.total)}</span>
                </li>
              ))}
              {orders.data.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet.</li>}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
