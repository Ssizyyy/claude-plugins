import { AlertCircle, Inbox } from "lucide-react"
import { Button } from "@/polished/ui/button"

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <div>
        <div className="font-medium">Couldn't load this</div>
        <div className="text-sm text-muted-foreground">{message}</div>
      </div>
      <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{hint}</div>
    </div>
  )
}
