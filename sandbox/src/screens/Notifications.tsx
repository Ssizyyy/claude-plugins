import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { save } from "@/api"

type Note = { id: number; text: string; tone: "ok" | "error" | "info" }
const tones = { ok: "bg-green-600", error: "bg-red-600", info: "bg-gray-800" }

export default function Notifications() {
  const [notes, setNotes] = useState<Note[]>([])
  const [confirm, setConfirm] = useState(false)
  const push = (text: string, tone: Note["tone"]) => {
    const id = Date.now() + Math.random()
    setNotes((n) => [...n, { id, text, tone }])
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 3000)
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Feedback playground</h1>
      <p className="text-sm text-gray-500">Transient feedback after actions: saves, deletes, async results.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save("x").then(() => push("Settings saved", "ok"))}>Save settings</Button>
        <Button variant="outline" onClick={() => push("Payment failed for ORD-1038", "error")}>Simulate failure</Button>
        <Button variant="outline" onClick={() => push("3 new orders since you looked", "info")}>Info</Button>
        <Button variant="destructive" onClick={() => setConfirm(true)}>Delete order</Button>
        <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltips explain icon-only controls</TooltipContent>
        </Tooltip>
        </TooltipProvider>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ORD-1042?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirm(false); push("Order deleted", "ok") }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="fixed bottom-4 right-4 space-y-2">
        {notes.map((n) => (
          <div key={n.id} className={`rounded px-4 py-2 text-sm text-white shadow ${tones[n.tone]}`}>{n.text}</div>
        ))}
      </div>
    </main>
  )
}
