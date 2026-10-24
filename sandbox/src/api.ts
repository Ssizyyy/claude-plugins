// Fake async API: every call waits and can fail, so loading, error and empty states are real.
// Tune from the URL: ?latency=1500 ms (default 600), ?fail=1 always fails, ?empty=1 returns nothing.
import { orders, products, type Order, type Product } from "@/fixtures"

const param = (k: string) => new URLSearchParams(location.hash.split("?")[1]).get(k)

async function call<T>(data: T, empty: T): Promise<T> {
  await new Promise((r) => setTimeout(r, Number(param("latency") ?? 600)))
  if (param("fail") === "1") throw new Error("Request failed (simulated)")
  return param("empty") === "1" ? empty : data
}

export const getProducts = () => call<Product[]>(products, [])
export const getOrders = () => call<Order[]>(orders, [])
export const save = (what: string) => call(what, what)
