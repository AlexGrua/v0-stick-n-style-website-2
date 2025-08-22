"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function AccountPage() {
  const { user, updateProfile, logout } = useAuth()
  const [username, setUsername] = useState(user?.username ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [messenger, setMessenger] = useState(user?.messenger ?? "")

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Вы не авторизованы</CardTitle>
          </CardHeader>
          <CardContent>Пожалуйста, войдите через иконку в шапке.</CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-6">
        <Image src="/icons/builder.png" alt="User" width={48} height={48} />
        <Button
          variant="outline"
          className="ml-auto text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
          onClick={() => logout()}
        >
          Log out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 max-w-xl"
            onSubmit={async (e) => {
              e.preventDefault()
              await updateProfile({ username, email, phone, messenger })
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="username">Логин</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="messenger">Messenger</Label>
              <Input id="messenger" value={messenger} onChange={(e) => setMessenger(e.target.value)} />
            </div>
            <div>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
