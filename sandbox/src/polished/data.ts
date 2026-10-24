import { getOrders, getProducts, param } from "@/api"
import type { Order, Product } from "@/fixtures"

// ?worst=1 swaps in hostile data: long and non-Latin names, unbreakable emails, emoji, extreme numbers.
const worstNames = [
  "Wolfeschlegelsteinhausenbergerdorff-Featherstonehaugh Maximilian Alexander",
  "ジョン・スミス",
  "مريم عبد الرحمن",
  "X",
  "Zoë 🎉 O'Brien-Nakamura",
]
const worstEmails = [
  "averyveryveryveryveryverylongemailaddresswithnospacestobreakat@subdomain.exampleexampleexample.com",
  "x@y.co",
  "",
]

export const worst = () => param("worst") === "1"

export async function loadOrders(): Promise<Order[]> {
  const rows = await getOrders()
  if (!worst()) return rows
  return rows.map((o, i) => ({
    ...o,
    customer: worstNames[i % worstNames.length],
    email: worstEmails[i % worstEmails.length],
    total: [0, 0.01, 1234567.89, 99999999.99][i % 4],
  }))
}

export async function loadProducts(): Promise<Product[]> {
  const rows = await getProducts()
  if (!worst()) return rows
  return rows.map((p, i) => ({
    ...p,
    name: i % 3 === 0 ? "Hand-Forged Artisanal Small-Batch Single-Origin Ceramic Pour-Over Coffee Brewing Set with Walnut Stand" : i % 3 === 1 ? "茶" : p.name,
    stock: [0, 1, 99999][i % 3],
    price: [0, 9999999][i % 2],
  }))
}
