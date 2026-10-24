import { useCallback, useMemo, useState } from "react"
import { Search, Star } from "lucide-react"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Badge } from "@/polished/ui/badge"
import { Button } from "@/polished/ui/button"
import { Card, CardContent } from "@/polished/ui/card"
import { Input } from "@/polished/ui/input"
import { Label } from "@/polished/ui/label"
import { Skeleton } from "@/polished/ui/skeleton"
import { loadProducts } from "@/polished/data"
import { EmptyState, ErrorState } from "@/polished/States"
import { money } from "@/polished/StatusBadge"
import { useAsync } from "@/useAsync"

const PER_PAGE = 8

export default function Products() {
  const { data, error, loading, retry } = useAsync(useCallback(loadProducts, []))
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)

  const cats = useMemo(() => ["all", ...Array.from(new Set((data ?? []).map((p) => p.category)))], [data])
  const rows = (data ?? []).filter(
    (p) => (cat === "all" || p.category === cat) && (!inStock || p.stock > 0) && p.name.toLowerCase().includes(q.toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const reset = () => setPage(1)

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <Button>Add product</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-full overflow-x-auto">
          <Tabs value={cat} onValueChange={(v) => { setCat(v); reset() }}>
            <TabsList className="pointer-coarse:h-11">
              {cats.map((c) => (
                <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4">
          <Label className="cursor-pointer gap-2 font-normal whitespace-nowrap">
            <Checkbox checked={inStock} onCheckedChange={(v) => { setInStock(v === true); reset() }} />
            In stock only
          </Label>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Search products" placeholder="Search products" className="pl-8" value={q} onChange={(e) => { setQ(e.target.value); reset() }} />
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} retry={retry} />}
      {loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}
      {data && rows.length === 0 && <EmptyState title="No products found" hint="Clear the filters or search for something else." />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shown.map((p) => (
          <Card key={p.id} className="gap-3 overflow-hidden py-0 shadow-[var(--shadow-sm)]">
            <div className="h-28 bg-muted" aria-hidden />
            <CardContent className="space-y-2 px-4 pb-4">
              <div className="line-clamp-2 min-h-10 text-sm font-medium" title={p.name}>{p.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-current" aria-hidden />
                <span className="tnum">{p.rating}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{p.category}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="tnum truncate font-medium">{money(p.price)}</span>
                {p.stock === 0 ? (
                  <Badge className="border-transparent bg-destructive/10 text-destructive">Sold out</Badge>
                ) : (
                  <span className="tnum shrink-0 text-xs text-muted-foreground">{p.stock.toLocaleString()} left</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="tnum">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </main>
  )
}
