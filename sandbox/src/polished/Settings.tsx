import { useState } from "react"
import { sileo } from "sileo"
import { Switch } from "@/components/animate-ui/components/radix/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/polished/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/polished/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/polished/ui/dialog"
import { Input } from "@/polished/ui/input"
import { Label } from "@/polished/ui/label"
import { Textarea } from "@/polished/ui/textarea"
import { save } from "@/api"
import { user } from "@/fixtures"

const notifications = [
  ["New orders", "Email me when an order is placed"],
  ["Failed payments", "Email me when a payment fails"],
  ["Weekly summary", "A digest every Monday morning"],
]

export default function Settings() {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState("")
  const [confirm, setConfirm] = useState(false)
  const bad = !/^\S+@\S+\.\S+$/.test(email)
  const [touched, setTouched] = useState(false)

  const submit = () => {
    setTouched(true)
    if (bad || !name.trim()) return
    sileo.promise(save("profile"), {
      loading: { title: "Saving profile" },
      success: { title: "Profile saved" },
      error: { title: "Couldn't save", description: "Check your connection and try again." },
    })
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList className="pointer-coarse:h-11">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-[var(--shadow-sm)]">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How you appear to your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={touched && !name.trim()} />
                {touched && !name.trim() && <p className="text-xs text-destructive">Name is required.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && bad} />
                {touched && bad && <p className="text-xs text-destructive">Enter a valid email address.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-bio">Bio</Label>
                <Textarea id="p-bio" placeholder="A few words about you" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={submit}>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-[var(--shadow-sm)]">
            <CardContent className="divide-y">
              {notifications.map(([title, desc], i) => (
                <div key={title} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <Label htmlFor={`n-${i}`} className="font-medium">{title}</Label>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                  <Switch id={`n-${i}`} defaultChecked={i === 0} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/40 shadow-[var(--shadow-sm)]">
            <CardHeader>
              <CardTitle>Delete workspace</CardTitle>
              <CardDescription>This removes {user.company} and all of its orders. It can't be undone.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive" onClick={() => setConfirm(true)}>Delete workspace</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {user.company}?</DialogTitle>
            <DialogDescription>All orders, products and customers will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirm(false)
                sileo.info({ title: "Nothing was deleted", description: "This is sandbox data." })
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
