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

const seedOrders: Order[] = [
  { id: "ORD-1042", customer: "Maya Chen", email: "maya@example.com", total: 129.5, status: "paid", date: "2026-10-21" },
  { id: "ORD-1041", customer: "Jonas Weber", email: "jonas.weber@example.com", total: 48, status: "pending", date: "2026-10-21" },
  { id: "ORD-1040", customer: "Amara Okafor", email: "amara@example.com", total: 312.99, status: "paid", date: "2026-10-20" },
  { id: "ORD-1039", customer: "Luis García", email: "luis.garcia@example.com", total: 75.25, status: "refunded", date: "2026-10-20" },
  { id: "ORD-1038", customer: "Sofia Rossi", email: "sofia@example.com", total: 19.99, status: "failed", date: "2026-10-19" },
  { id: "ORD-1037", customer: "Kenji Tanaka", email: "kenji.t@example.com", total: 220, status: "paid", date: "2026-10-19" },
  { id: "ORD-1036", customer: "Priya Nair", email: "priya.nair@example.com", total: 64.1, status: "paid", date: "2026-10-18" },
  { id: "ORD-1035", customer: "Tom Becker", email: "tom@example.com", total: 540, status: "pending", date: "2026-10-18" },
]

const people = [
  "Hannah Lee", "Diego Ramos", "Fatima Khan", "Oliver Smith", "Yuki Sato", "Elena Petrova", "Noah Johnson", "Aisha Bello",
  "Lucas Martin", "Chloe Dubois", "Ravi Patel", "Emma Wilson", "Mateo Silva", "Ingrid Larsen", "Omar Haddad", "Grace Kim",
  "Felix Braun", "Lena Fischer", "Carlos Díaz", "Nora Evans", "Ethan Brown", "Zoe Taylor", "Ivan Novak", "Mia Costa",
  "Leo Müller", "Ana Silva", "Sam Carter", "Ruth Adler", "Hugo Blanc", "Dana Cohen", "Pablo Cruz", "Tess Morgan",
]
const statuses: Status[] = ["paid", "paid", "paid", "pending", "paid", "refunded", "paid", "failed"]

const generated: Order[] = people.map((name, i) => {
  const day = 17 - Math.floor(i / 3)
  const [first, last] = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")
  return {
    id: `ORD-${1034 - i}`,
    customer: name,
    email: i % 2 ? `${first}.${last}@example.com` : `${first}@example.com`,
    total: Math.round((18 + ((i * 47) % 420) + (i % 4) * 0.99) * 100) / 100,
    status: statuses[i % statuses.length],
    date: `2026-10-${String(Math.max(day, 1)).padStart(2, "0")}`,
  }
})

export const orders: Order[] = [...seedOrders, ...generated]

export type Product = { id: string; name: string; category: string; price: number; stock: number; rating: number }

export const products: Product[] = [
  { id: "P-01", name: "Ceramic Pour-Over Set", category: "Kitchen", price: 54, stock: 32, rating: 4.7 },
  { id: "P-02", name: "Linen Apron", category: "Kitchen", price: 38, stock: 14, rating: 4.5 },
  { id: "P-03", name: "Cast Iron Skillet", category: "Kitchen", price: 72, stock: 0, rating: 4.9 },
  { id: "P-04", name: "Walnut Cutting Board", category: "Kitchen", price: 64, stock: 21, rating: 4.8 },
  { id: "P-05", name: "Wool Throw Blanket", category: "Home", price: 120, stock: 9, rating: 4.6 },
  { id: "P-06", name: "Soy Candle, Cedar", category: "Home", price: 26, stock: 80, rating: 4.4 },
  { id: "P-07", name: "Ceramic Vase", category: "Home", price: 48, stock: 17, rating: 4.3 },
  { id: "P-08", name: "Brass Desk Lamp", category: "Home", price: 135, stock: 5, rating: 4.7 },
  { id: "P-09", name: "Canvas Tote", category: "Bags", price: 29, stock: 120, rating: 4.2 },
  { id: "P-10", name: "Leather Weekender", category: "Bags", price: 289, stock: 6, rating: 4.9 },
  { id: "P-11", name: "Roll-Top Backpack", category: "Bags", price: 149, stock: 22, rating: 4.6 },
  { id: "P-12", name: "Waxed Daypack", category: "Bags", price: 99, stock: 0, rating: 4.5 },
  { id: "P-13", name: "Merino Beanie", category: "Apparel", price: 34, stock: 60, rating: 4.4 },
  { id: "P-14", name: "Organic Cotton Tee", category: "Apparel", price: 28, stock: 140, rating: 4.1 },
  { id: "P-15", name: "Selvedge Denim Jacket", category: "Apparel", price: 178, stock: 11, rating: 4.8 },
  { id: "P-16", name: "Wool Socks, 3 pack", category: "Apparel", price: 24, stock: 95, rating: 4.6 },
  { id: "P-17", name: "Steel Water Bottle", category: "Outdoors", price: 32, stock: 70, rating: 4.7 },
  { id: "P-18", name: "Enamel Camp Mug", category: "Outdoors", price: 16, stock: 150, rating: 4.5 },
  { id: "P-19", name: "Packable Rain Shell", category: "Outdoors", price: 110, stock: 8, rating: 4.3 },
  { id: "P-20", name: "Trail Notebook", category: "Outdoors", price: 14, stock: 200, rating: 4.2 },
]

export const customers = Array.from(new Map(orders.map((o) => [o.email, { name: o.customer, email: o.email }])).values())

export const monthly = [
  { month: "Nov", revenue: 31200, orders: 740 }, { month: "Dec", revenue: 44800, orders: 1020 },
  { month: "Jan", revenue: 29100, orders: 690 }, { month: "Feb", revenue: 30500, orders: 720 },
  { month: "Mar", revenue: 34200, orders: 810 }, { month: "Apr", revenue: 36800, orders: 870 },
  { month: "May", revenue: 39400, orders: 930 }, { month: "Jun", revenue: 41000, orders: 975 },
  { month: "Jul", revenue: 40100, orders: 960 }, { month: "Aug", revenue: 43600, orders: 1040 },
  { month: "Sep", revenue: 45900, orders: 1110 }, { month: "Oct", revenue: 48210, orders: 1284 },
]

export const channels = [
  { channel: "Organic", orders: 480 }, { channel: "Email", orders: 310 }, { channel: "Paid", orders: 260 },
  { channel: "Social", orders: 150 }, { channel: "Referral", orders: 84 },
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
