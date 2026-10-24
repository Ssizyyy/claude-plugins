import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { customers, orders } from "@/fixtures"

export default function Customers() {
  const [open, setOpen] = useState<(typeof customers)[number] | null>(null)
  const theirs = open ? orders.filter((o) => o.email === open.email) : []

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead className="text-right">Spent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => {
            const mine = orders.filter((o) => o.email === c.email)
            return (
              <TableRow key={c.email} className="cursor-pointer" onClick={() => setOpen(c)}>
                <TableCell className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{c.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-gray-500">{c.email}</div>
                  </div>
                </TableCell>
                <TableCell>{mine.length}</TableCell>
                <TableCell className="text-right">${mine.reduce((s, o) => s + o.total, 0).toFixed(2)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
            <SheetDescription>{open?.email}</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 text-sm">
            {theirs.map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{o.id}</div>
                  <div className="text-gray-500">{o.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-700">{o.status}</Badge>${o.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
