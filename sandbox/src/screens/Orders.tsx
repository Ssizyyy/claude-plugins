import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { orders, type Status } from "@/fixtures"

const statusColor: Record<Status, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  refunded: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
}

export default function Orders() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const rows = orders.filter(
    (o) => (status === "all" || o.status === status) && `${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Button>New order</Button>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search orders" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["all", "paid", "pending", "refunded", "failed"].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.id}</TableCell>
              <TableCell>
                <div>{o.customer}</div>
                <div className="text-gray-500">{o.email}</div>
              </TableCell>
              <TableCell>{o.date}</TableCell>
              <TableCell>
                <Badge className={statusColor[o.status]}>{o.status}</Badge>
              </TableCell>
              <TableCell className="text-right">${o.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <p className="text-sm text-gray-500">No orders match.</p>}
    </main>
  )
}
