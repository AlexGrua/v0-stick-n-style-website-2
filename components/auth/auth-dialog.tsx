"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"

type Mode = "login" | "register" | "forgot"

export function AuthDialog({
  open,
  onOpenChange,
  mode = "login",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: Mode
}) {
  const { login, register } = useAuth()
  const [current, setCurrent] = useState<Mode>(mode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  function passwordIssues(pwd: string) {
    const issues: string[] = []
    if (pwd.length < 8) issues.push("Минимум 8 символов")
    if (!/[a-z]/.test(pwd)) issues.push("Строчная буква")
    if (!/[A-Z]/.test(pwd)) issues.push("Заглавная буква")
    if (!/[0-9]/.test(pwd)) issues.push("Цифра")
    return issues
  }

  async function handleLogin(form: FormData) {
    const id = String(form.get("identifier") || "")
    const pw = String(form.get("password") || "")
    setError(null)
    setLoading(true)
    const res = await login(id, pw)
    setLoading(false)
    if (!res.ok) setError(res.message || "Ошибка входа")
    else onOpenChange(false)
  }

  async function handleRegister(form: FormData) {
    const username = String(form.get("username") || "")
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")
    const confirm = String(form.get("confirm") || "")
    const phone = String(form.get("phone") || "")
    const messenger = String(form.get("messenger") || "")

    if (!username || !email || !password) {
      setError("Заполните обязательные поля")
      return
    }
    if (!isValidEmail(email)) {
      setError("Неверный email")
      return
    }
    if (password !== confirm) {
      setError("Пароли не совпадают")
      return
    }
    const issues = passwordIssues(password)
    if (issues.length) {
      setError(`Пароль: ${issues.join(", ")}`)
      return
    }

    setError(null)
    setLoading(true)
    const res = await register({
      username,
      email,
      password,
      phone: phone || undefined,
      messenger: messenger || undefined,
    })
    setLoading(false)
    if (!res.ok) setError(res.message || "Ошибка регистрации")
    else onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Вход и регистрация</DialogTitle>
        </DialogHeader>
        <Tabs value={current} onValueChange={(v) => setCurrent(v as Mode)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form
              action={(fd) => handleLogin(fd)}
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin(new FormData(e.currentTarget as HTMLFormElement))
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="identifier">Логин или Email</Label>
                <Input id="identifier" name="identifier" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Входим..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form
              action={(fd) => handleRegister(fd)}
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                handleRegister(new FormData(e.currentTarget as HTMLFormElement))
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="username">Логин</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" required type="email" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required />
                <p className="text-xs text-muted-foreground">Минимум 8 символов, цифра, строчная и заглавная буквы</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm">Повторите пароль</Label>
                <Input id="confirm" name="confirm" type="password" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone">Телефон (опц.)</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="messenger">Messenger (опц.)</Label>
                  <Input id="messenger" name="messenger" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Регистрируем..." : "Register"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="forgot" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Введите свой email — мы сгенерируем код для восстановления (демо).
            </p>
            <div className="space-y-1 mt-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" placeholder="you@example.com" />
            </div>
            <Button className="mt-3 w-full">Отправить код</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
