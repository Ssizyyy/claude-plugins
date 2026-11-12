import { Badge } from "@/polished/ui/badge"
import type { Status } from "@/fixtures"

const tone: Record<Status, string> = {
  paid: "bg-success text-success-foreground",
  pending: "bg-warning text-warning-foreground",
  refunded: "bg-info text-info-foreground",
  failed: "bg-destructive/10 text-destructive",
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={`${tone[status]} border-transparent capitalize`}>{status}</Badge>
}

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
