"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const returnTo = params.get("returnTo") || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || "Login failed")
      // Force full reload so Set-Cookie is applied before hitting /admin
      window.location.href = returnTo
    } catch (e: any) {
      setError(e?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // try to fetch current session and redirect if already logged in
    ;(async () => {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const j = await res.json()
          if (j?.data?.email) router.replace(returnTo)
        }
      } catch {}
    })()
  }, [returnTo, router])

  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
          <form onSubmit={handleLogin} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            <div className="text-[12px] text-muted-foreground">
              Demo: admin@example.com / admin123 (superadmin)
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}