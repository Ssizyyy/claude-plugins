import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Login() {
  return (
    <main className="flex min-h-[calc(100vh-45px)] items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Welcome back to Acme Goods.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="login-password">Password</Label>
                <a href="#/login" className="text-sm text-indigo-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <Input id="login-password" type="password" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember">Remember me</Label>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-gray-500">
          No account?&nbsp;<a href="#/landing" className="text-indigo-600 hover:underline">Start a trial</a>
        </CardFooter>
      </Card>
    </main>
  )
}
