"use client"

import type { PublicUser, StoredUser, Role, Permission } from "@/types/auth"
import { getDefaultPermissionsForRole } from "./permissions"

const LS_USERS_KEY = "sns.users"
const LS_SESSION_KEY = "sns.sessionUserId"

// Helpers
function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users))
}

function nowISO() {
  return new Date().toISOString()
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LS_SESSION_KEY)
}

function setSessionUserId(id: string | null) {
  if (typeof window === "undefined") return
  if (id) localStorage.setItem(LS_SESSION_KEY, id)
  else localStorage.removeItem(LS_SESSION_KEY)
}

function toPublic(u: StoredUser): PublicUser {
  // Omit passwordHash/resetCode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, resetCode, ...pub } = u
  return pub
}

// Seed an initial admin if none exist
export async function ensureSeedAdmin() {
  const users = readUsers()
  if (users.length === 0) {
    const passwordHash = await hashPassword("admin123")
    const admin: StoredUser = {
      id: crypto.randomUUID(),
      username: "admin",
      email: "admin@example.com",
      phone: "",
      messenger: "",
      role: "superadmin",
      permissions: getDefaultPermissionsForRole("superadmin"),
      active: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      passwordHash,
    }
    writeUsers([admin])
  }
}

// Public API used by AuthProvider
export async function registerUser(input: {
  username: string
  email: string
  password: string
  phone?: string
  messenger?: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { username, email, password, phone, messenger } = input
  const users = readUsers()

  if (!username.trim() || !email.trim() || !password.trim()) {
    return { ok: false, error: "Заполните обязательные поля." }
  }

  const exists =
    users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ||
    users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) return { ok: false, error: "Такой логин или email уже зарегистрирован." }

  const passwordHash = await hashPassword(password)
  const u: StoredUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    messenger: messenger?.trim(),
    role: "staff",
    permissions: getDefaultPermissionsForRole("staff"),
    active: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    passwordHash,
  }
  writeUsers([...users, u])
  setSessionUserId(u.id)
  return { ok: true, user: toPublic(u) }
}

export async function loginUser(input: {
  loginOrEmail: string
  password: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { loginOrEmail, password } = input
  const users = readUsers()
  const cand = users.find(
    (u) =>
      u.username.toLowerCase() === loginOrEmail.toLowerCase() || u.email.toLowerCase() === loginOrEmail.toLowerCase(),
  )
  if (!cand) return { ok: false, error: "Пользователь не найден." }
  if (!cand.active) return { ok: false, error: "Аккаунт деактивирован администратором." }

  const passwordHash = await hashPassword(password)
  if (passwordHash !== cand.passwordHash) return { ok: false, error: "Неверный пароль." }

  setSessionUserId(cand.id)
  return { ok: true, user: toPublic(cand) }
}

export function logoutUser() {
  setSessionUserId(null)
}

export function currentUser(): PublicUser | null {
  const id = getSessionUserId()
  if (!id) return null
  const users = readUsers()
  const u = users.find((x) => x.id === id)
  return u ? toPublic(u) : null
}

export function getAllUsers(): PublicUser[] {
  return readUsers().map(toPublic)
}

export function findUserById(id: string): PublicUser | null {
  const u = readUsers().find((x) => x.id === id)
  return u ? toPublic(u) : null
}

export function requestPasswordReset(loginOrEmail: string): { ok: boolean; code?: string; error?: string } {
  const users = readUsers()
  const idx = users.findIndex(
    (u) =>
      u.username.toLowerCase() === loginOrEmail.toLowerCase() || u.email.toLowerCase() === loginOrEmail.toLowerCase(),
  )
  if (idx === -1) return { ok: false, error: "Пользователь не найден." }
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  users[idx].resetCode = code
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  // In a real app we would send this by email.
  return { ok: true, code }
}

export async function resetPassword(input: {
  loginOrEmail: string
  code: string
  newPassword: string
}): Promise<{ ok: boolean; error?: string }> {
  const users = readUsers()
  const idx = users.findIndex(
    (u) =>
      u.username.toLowerCase() === input.loginOrEmail.toLowerCase() ||
      u.email.toLowerCase() === input.loginOrEmail.toLowerCase(),
  )
  if (idx === -1) return { ok: false, error: "Пользователь не найден." }
  const u = users[idx]
  if (u.resetCode !== input.code) return { ok: false, error: "Неверный код подтверждения." }
  users[idx].passwordHash = await hashPassword(input.newPassword)
  delete users[idx].resetCode
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  return { ok: true }
}

export async function updateProfile(input: {
  id: string
  username?: string
  email?: string
  phone?: string
  messenger?: string
  newPassword?: { current: string; next: string }
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === input.id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден." }

  // Unique checks for username/email
  if (input.username) {
    const dup = users.find((u) => u.username.toLowerCase() === input.username!.toLowerCase() && u.id !== input.id)
    if (dup) return { ok: false, error: "Такой логин уже занят." }
  }
  if (input.email) {
    const dup = users.find((u) => u.email.toLowerCase() === input.email!.toLowerCase() && u.id !== input.id)
    if (dup) return { ok: false, error: "Такой email уже используется." }
  }

  const u = users[idx]
  if (input.newPassword) {
    const currentHash = await hashPassword(input.newPassword.current)
    if (currentHash !== u.passwordHash) return { ok: false, error: "Текущий пароль неверный." }
    u.passwordHash = await hashPassword(input.newPassword.next)
  }

  u.username = input.username ?? u.username
  u.email = input.email ?? u.email
  u.phone = input.phone ?? u.phone
  u.messenger = input.messenger ?? u.messenger
  u.updatedAt = nowISO()
  users[idx] = u
  writeUsers(users)
  return { ok: true, user: toPublic(u) }
}

// Admin methods
export function adminSetActive(id: string, active: boolean): { ok: boolean } {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false }
  users[idx].active = active
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  return { ok: true }
}

export function adminChangeRole(id: string, newRole: Role): { ok: boolean; error?: string } {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  
  // Проверяем, что не пытаемся изменить роль суперадмина
  if (users[idx].role === "superadmin") {
    return { ok: false, error: "Нельзя изменить роль суперадмина" }
  }
  
  users[idx].role = newRole
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  return { ok: true }
}

export async function adminCreateUser(input: {
  username: string
  email: string
  password: string
  role: Role
  phone?: string
  messenger?: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { username, email, password, role, phone, messenger } = input
  const users = readUsers()

  if (!username.trim() || !email.trim() || !password.trim()) {
    return { ok: false, error: "Заполните обязательные поля." }
  }

  // Проверяем уникальность
  const exists =
    users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ||
    users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) return { ok: false, error: "Такой логин или email уже зарегистрирован." }

  // Создаем пользователя
  const passwordHash = await hashPassword(password)
  const u: StoredUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    messenger: messenger?.trim(),
    role,
    permissions: getDefaultPermissionsForRole(role),
    active: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    passwordHash,
  }
  writeUsers([...users, u])
  return { ok: true, user: toPublic(u) }
}

export function adminDeleteUser(id: string): { ok: boolean } {
  const users = readUsers().filter((u) => u.id !== id)
  writeUsers(users)
  // If deleting current session, logout.
  const cur = getSessionUserId()
  if (cur === id) setSessionUserId(null)
  return { ok: true }
}

// Импортируем функции разрешений из серверного файла
import { hasPermission as hasPermissionServer, hasAnyPermission as hasAnyPermissionServer } from "./permissions"

// Клиентские обертки для функций разрешений
export function hasPermission(user: PublicUser | null, permission: Permission): boolean {
  return hasPermissionServer(user, permission)
}

export function hasPermissionForAuthUser(user: { role?: string; permissions?: Permission[] } | null, permission: Permission): boolean {
  return hasPermissionServer(user, permission)
}

export function hasAnyPermission(user: PublicUser | null, permissions: Permission[]): boolean {
  return hasAnyPermissionServer(user, permissions)
}

// Функции для управления разрешениями
export function adminUpdateUserPermissions(id: string, permissions: Permission[]): { ok: boolean; error?: string } {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  if (users[idx].role === "superadmin") {
    return { ok: false, error: "Нельзя изменять разрешения суперадмина" }
  }
  users[idx].permissions = permissions
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  return { ok: true }
}

export function adminUpdateUserRole(id: string, newRole: Role): { ok: boolean; error?: string } {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  if (users[idx].role === "superadmin") {
    return { ok: false, error: "Нельзя изменить роль суперадмина" }
  }
  users[idx].role = newRole
  users[idx].permissions = getDefaultPermissionsForRole(newRole) // Обновляем разрешения по новой роли
  users[idx].updatedAt = nowISO()
  writeUsers(users)
  return { ok: true }
}

// Экспортируем функцию из серверного файла
export { getAllPermissions } from "./permissions"
