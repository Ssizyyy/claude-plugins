import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { activity, stats, weekly } from "@/fixtures"

export default function Dashboard() {
  const max = Math.max(...weekly)
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">{s.change} vs last month</CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly revenue</CardTitle>
            <CardDescription>Last 12 weeks, in thousands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {weekly.map((v, i) => (
                <div key={i} className="flex-1 rounded-t bg-indigo-500" style={{ height: `${(v / max) * 100}%` }} title={`$${v}k`} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((a) => (
              <div key={a.what} className="flex items-center gap-3 text-sm">
                <Avatar>
                  <AvatarFallback>{a.who.split(" ").map((p) => p[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <div>
                    <span className="font-medium">{a.who}</span> {a.what}
                  </div>
                  <div className="text-gray-500">{a.when}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
