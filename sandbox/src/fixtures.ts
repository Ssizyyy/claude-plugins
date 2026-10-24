// Fixture data only. There is no backend.

export type Status = "paid" | "pending" | "refunded" | "failed"

export type Order = {
  id: string
  customer: string
  email: string
  total: number
  status: Status
  date: string
}

export const orders: Order[] = [
  { id: "ORD-1042", customer: "Maya Chen", email: "maya@example.com", total: 129.5, status: "paid", date: "2026-10-21" },
  { id: "ORD-1041", customer: "Jonas Weber", email: "jonas.weber@example.com", total: 48, status: "pending", date: "2026-10-21" },
  { id: "ORD-1040", customer: "Amara Okafor", email: "amara@example.com", total: 312.99, status: "paid", date: "2026-10-20" },
  { id: "ORD-1039", customer: "Luis García", email: "luis.garcia@example.com", total: 75.25, status: "refunded", date: "2026-10-20" },
  { id: "ORD-1038", customer: "Sofia Rossi", email: "sofia@example.com", total: 19.99, status: "failed", date: "2026-10-19" },
  { id: "ORD-1037", customer: "Kenji Tanaka", email: "kenji.t@example.com", total: 220, status: "paid", date: "2026-10-19" },
  { id: "ORD-1036", customer: "Priya Nair", email: "priya.nair@example.com", total: 64.1, status: "paid", date: "2026-10-18" },
  { id: "ORD-1035", customer: "Tom Becker", email: "tom@example.com", total: 540, status: "pending", date: "2026-10-18" },
]

export const stats = [
  { label: "Revenue", value: "$48,210", change: "+12.4%" },
  { label: "Orders", value: "1,284", change: "+3.1%" },
  { label: "Customers", value: "932", change: "+8.0%" },
  { label: "Refund rate", value: "1.8%", change: "-0.4%" },
]

// last 12 weeks of revenue, in thousands
export const weekly = [28, 31, 30, 35, 33, 38, 41, 39, 44, 42, 46, 48]

export const activity = [
  { who: "Maya Chen", what: "placed order ORD-1042", when: "2 min ago" },
  { who: "Jonas Weber", what: "started checkout", when: "14 min ago" },
  { who: "Luis García", what: "was refunded $75.25", when: "1 h ago" },
  { who: "Sofia Rossi", what: "payment failed", when: "3 h ago" },
]

export const user = { name: "Alex Morgan", email: "alex@example.com", company: "Acme Goods" }
