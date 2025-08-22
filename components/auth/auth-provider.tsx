"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export type AuthUser = {
  id: string
  username: string
  email: string
  phone?: string
  messenger?: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>
  register: (data: {
    username: string
    email: string
    password: string
    phone?: string
    messenger?: string
  }) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => Promise<{ ok: boolean }>
}

const USERS_KEY = "sns_users"
const CURRENT_KEY = "sns_user"

type StoredUser = AuthUser & { password: string }

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}
function writeUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
function readCurrent(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}
function writeCurrent(user: AuthUser | null) {
  if (typeof window === "undefined") return
  if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
  else localStorage.removeItem(CURRENT_KEY)
}

const AuthContext = createContext<AuthContextValue | null>(null)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(readCurrent())
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => {
      const users = readUsers()
      const found = users.find(
        (u) =>
          (u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase()) &&
          u.password === password,
      )
      if (!found) return { ok: false, message: "Неверный логин или пароль" }
      const { password: _pw, ...publicUser } = found
      writeCurrent(publicUser)
      setUser(publicUser)
      toast({ description: "Вы успешно вошли" })
      return { ok: true }
    },
    [toast],
  )

  const register = useCallback(
    async (data: { username: string; email: string; password: string; phone?: string; messenger?: string }) => {
      const users = readUsers()
      const exists =
        users.some((u) => u.username.toLowerCase() === data.username.toLowerCase()) ||
        users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
      if (exists) return { ok: false, message: "Логин или email уже используются" }

      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        username: data.username,
        email: data.email,
        phone: data.phone,
        messenger: data.messenger,
        password: data.password,
      }
      writeUsers([...users, newUser])
      const { password: _pw, ...publicUser } = newUser
      writeCurrent(publicUser)
      setUser(publicUser)
      toast({ description: "Регистрация выполнена" })
      return { ok: true }
    },
    [toast],
  )

  const logout = useCallback(() => {
    writeCurrent(null)
    setUser(null)
    toast({ description: "Вы вышли из аккаунта" })
  }, [toast])

  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      if (!user) return { ok: false }
      const nextUser = { ...user, ...data }
      // persist current
      writeCurrent(nextUser)
      setUser(nextUser)
      // update in list
      const list = readUsers()
      const idx = list.findIndex((u) => u.id === user.id)
      if (idx !== -1) {
        const prev = list[idx]
        list[idx] = { ...prev, ...nextUser }
        writeUsers(list)
      }
      return { ok: true }
    },
    [user],
  )

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
