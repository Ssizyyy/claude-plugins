import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { user } from "@/fixtures"

const notifications = [
  ["New orders", "Email me when an order is placed"],
  ["Failed payments", "Email me when a payment fails"],
  ["Weekly summary", "A digest every Monday morning"],
]

export default function Settings() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How you appear to your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="A few words about you" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardContent className="space-y-4">
              {notifications.map(([title, desc], i) => (
                <div key={title}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-sm text-gray-500">{desc}</div>
                    </div>
                    <Switch defaultChecked={i === 0} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle>Delete workspace</CardTitle>
              <CardDescription>This removes {user.company} and all of its orders. It can't be undone.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="destructive">Delete workspace</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
