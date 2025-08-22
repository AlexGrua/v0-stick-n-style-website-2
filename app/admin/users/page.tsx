"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { PublicUser } from "@/types/auth"
import { adminDeleteUser, adminSetActive, getAllUsers } from "@/lib/auth-storage"

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [q, setQ] = useState("")

  function load() {
    setUsers(getAllUsers())
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      (u.phone ?? "").toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <Input placeholder="Поиск..." className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всего: {filtered.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-semibold">{u.username.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{u.username}</div>
                    <Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge>
                    <Badge variant={u.active ? "default" : "destructive"}>{u.active ? "active" : "inactive"}</Badge>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={u.active ? "secondary" : "default"}
                  onClick={() => {
                    adminSetActive(u.id, !u.active)
                    load()
                  }}
                >
                  {u.active ? "Деактивировать" : "Активировать"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    adminDeleteUser(u.id)
                    toast({ title: "Удалено", description: `Пользователь ${u.username} удалён` })
                    load()
                  }}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-10 text-center text-muted-foreground">Нет результатов</div>}
        </CardContent>
      </Card>
    </main>
  )
}
