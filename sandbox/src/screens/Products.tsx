import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getProducts } from "@/api"
import { useAsync } from "@/useAsync"

const PER_PAGE = 8

export default function Products() {
  const { data, error, loading, retry } = useAsync(getProducts)
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [page, setPage] = useState(1)

  const all = data ?? []
  const cats = Array.from(new Set(all.map((p) => p.category)))
  const rows = all.filter((p) => (cat === "all" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()))
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button>Add product</Button>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search products" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="max-w-xs" />
        <Select value={cat} onValueChange={(v) => { setCat(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button className="underline" onClick={retry}>Retry</button>
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}
      {!loading && !error && rows.length === 0 && <p className="text-sm text-gray-500">No products.</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {shown.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2">
              <div className="h-24 rounded bg-gray-100" />
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">{p.category} · ★ {p.rating}</div>
              <div className="flex items-center justify-between">
                <span>${p.price}</span>
                {p.stock === 0 ? <Badge className="bg-red-100 text-red-700">Sold out</Badge> : <span className="text-sm text-gray-500">{p.stock} left</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pages > 1 && (
        <Pagination>
          <PaginationContent>
            {Array.from({ length: pages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#/products" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1) }}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      )}
    </main>
  )
}
