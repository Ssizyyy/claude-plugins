import { useCallback, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/animate-ui/components/radix/sheet"
import { Button } from "@/polished/ui/button"
import { Input } from "@/polished/ui/input"
import { Skeleton } from "@/polished/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/polished/ui/table"
import type { Order } from "@/fixtures"
import { loadOrders } from "@/polished/data"
import { EmptyState, ErrorState } from "@/polished/States"
import { StatusBadge, money } from "@/polished/StatusBadge"
import { useAsync } from "@/useAsync"

const PER_PAGE = 10
const filters = ["all", "paid", "pending", "refunded", "failed"]

export default function Orders() {
  const { data, error, loading, retry } = useAsync(useCallback(loadOrders, []))
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Order | null>(null)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (o) => (status === "all" || o.status === status) && `${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q, status],
  )
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
        <Button>New order</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <TabsList className="pointer-coarse:h-11">
            {filters.map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">{f}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search orders"
            placeholder="Search orders"
            className="pl-8"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {error && <ErrorState message={error} retry={retry} />}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}
      {data && rows.length === 0 && <EmptyState title="No orders match" hint="Try a different search or status." />}
      {data && rows.length > 0 && (
        <div className="rounded-xl border bg-card shadow-[var(--shadow-sm)]">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 sm:w-24">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden w-28 sm:table-cell">Date</TableHead>
                <TableHead className="hidden w-28 sm:table-cell">Status</TableHead>
                <TableHead className="w-28 text-right sm:w-32">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((o) => (
                <TableRow key={o.id} tabIndex={0} aria-haspopup="dialog" className="cursor-pointer" onClick={() => setOpen(o)} onKeyDown={(e) => e.key === "Enter" && setOpen(o)}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>
                    <div className="truncate">{o.customer}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.email || "No email"}</div>
                    <div className="mt-1 sm:hidden">
                      <StatusBadge status={o.status} />
                    </div>
                  </TableCell>
                  <TableCell className="tnum hidden text-muted-foreground sm:table-cell">{o.date}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="tnum truncate text-right">{money(o.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
            <span className="tnum">
              {rows.length} order{rows.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="tnum">{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{open?.id}</SheetTitle>
            <SheetDescription className="break-all">{open?.customer}</SheetDescription>
          </SheetHeader>
          {open && (
            <dl className="space-y-3 px-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={open.status} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="tnum">{open.date}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="min-w-0 break-all text-right">{open.email || "No email"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="tnum">{money(open.total)}</dd>
              </div>
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}
