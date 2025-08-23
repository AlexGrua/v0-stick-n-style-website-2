"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Permission } from "@/types/auth"

export type AuthUser = {
  id?: string
  username?: string
  email: string
  role?: "superadmin" | "admin" | "staff"
  permissions?: Permission[]
}

type AuthContextValue = {
  user: AuthUser | null
  login: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>
  register: (data: { username: string; email: string; password: string; phone?: string; messenger?: string }) => Promise<{
    ok: boolean
    message?: string
  }>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => Promise<{ ok: boolean }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        if (res.ok) {
          const j = await res.json()
          if (j?.data?.email) setUser({ 
            email: j.data.email, 
            role: j.data.role,
            permissions: j.data.permissions || []
          })
        }
      } catch {}
    })()
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password }),
        })
        const data = await res.json()
        if (!res.ok || !data?.success) return { ok: false, message: data?.error || "Ошибка входа" }
        setUser({ 
          email: data.data.email, 
          role: data.data.role,
          permissions: data.data.permissions || []
        })
        toast({ description: "Вы успешно вошли" })
        return { ok: true }
      } catch (e: any) {
        return { ok: false, message: e?.message || "Ошибка входа" }
      }
    },
    [toast],
  )

  const register = useCallback(
    async (data: { username: string; email: string; password: string }) => {
      // For MVP: register is login if dev fallback
      const res = await login(data.email, data.password)
      if (!res.ok) return { ok: false, message: res.message }
      return { ok: true }
    },
    [login],
  )

  const logout = useCallback(() => {
    fetch("/api/auth/session", { method: "DELETE" }).finally(() => {
      setUser(null)
      toast({ description: "Вы вышли из аккаунта" })
      // Перенаправляем на страницу логина
      window.location.href = "/admin/login"
    })
  }, [toast])

  const updateProfile = useCallback(async () => ({ ok: true }), [])

  const value: AuthContextValue = useMemo(
    () => ({ user, login, register, logout, updateProfile }),
    [user, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
