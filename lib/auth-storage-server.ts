import type { PublicUser, StoredUser, Role, Permission } from "@/types/auth"
import { getDefaultPermissionsForRole } from "./permissions"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"

// Серверная версия для работы с пользователями
// В реальном приложении здесь была бы база данных

// Файл для хранения пользователей
const USERS_FILE = join(process.cwd(), "data", "users.json")

// Временное хранилище пользователей в памяти (только для разработки)
let serverUsers: StoredUser[] = []

// Функция для загрузки пользователей из файла
function loadUsersFromFile(): StoredUser[] {
  try {
    if (existsSync(USERS_FILE)) {
      const data = readFileSync(USERS_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.log("[DEBUG] Failed to load users from file:", error)
  }
  return []
}

// Функция для сохранения пользователей в файл
function saveUsersToFile(users: StoredUser[]) {
  try {
    // Создаем директорию если её нет
    const { mkdirSync } = require("fs")
    const dir = join(process.cwd(), "data")
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    console.log(`[DEBUG] Users saved to file: ${users.length} users`)
  } catch (error) {
    console.log("[DEBUG] Failed to save users to file:", error)
  }
}

// Инициализация с дефолтным админом
async function initializeServerUsers() {
  // Сначала пытаемся загрузить из файла
  serverUsers = loadUsersFromFile()
  
  // Если файл пустой или не существует, создаем дефолтного админа
  if (serverUsers.length === 0) {
    const admin: StoredUser = {
      id: "admin-1",
      username: "admin",
      email: "admin@example.com",
      phone: "",
      messenger: "",
      role: "superadmin",
      permissions: getDefaultPermissionsForRole("superadmin"),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash: await hashPassword("admin123"),
    }
    serverUsers = [admin]
    saveUsersToFile(serverUsers)
  }
  
  console.log(`[DEBUG] Initialized with ${serverUsers.length} users`)
}

// Инициализируем при загрузке модуля
initializeServerUsers()

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function toPublic(u: StoredUser): PublicUser {
  const { passwordHash, resetCode, ...pub } = u
  return pub
}

// Серверная версия логина
export async function serverLoginUser(input: {
  loginOrEmail: string
  password: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { loginOrEmail, password } = input
  
  console.log(`[DEBUG] serverLoginUser: searching for ${loginOrEmail}`)
  console.log(`[DEBUG] Available users:`, serverUsers.map(u => ({ username: u.username, email: u.email, active: u.active })))
  
  const cand = serverUsers.find(
    (u) =>
      u.username.toLowerCase() === loginOrEmail.toLowerCase() || 
      u.email.toLowerCase() === loginOrEmail.toLowerCase(),
  )
  
  if (!cand) {
    console.log(`[DEBUG] User not found`)
    return { ok: false, error: "Пользователь не найден." }
  }
  
  if (!cand.active) {
    console.log(`[DEBUG] User inactive`)
    return { ok: false, error: "Аккаунт деактивирован администратором." }
  }

  const passwordHash = await hashPassword(password)
  console.log(`[DEBUG] Password check: ${passwordHash === cand.passwordHash}`)
  
  if (passwordHash !== cand.passwordHash) return { ok: false, error: "Неверный пароль." }

  console.log(`[DEBUG] Login successful for ${cand.username}`)
  return { ok: true, user: toPublic(cand) }
}

// Функции валидации
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Пароль должен содержать минимум 8 символов" }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: "Пароль не должен превышать 128 символов" }
  }
  
  // Проверяем наличие хотя бы одной буквы
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: "Пароль должен содержать хотя бы одну букву" }
  }
  
  // Проверяем наличие хотя бы одной цифры
  if (!/\d/.test(password)) {
    return { isValid: false, error: "Пароль должен содержать хотя бы одну цифру" }
  }
  
  // Проверяем наличие хотя бы одного специального символа
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: "Пароль должен содержать хотя бы один специальный символ (!@#$%^&*()_+-=[]{}|;:,.<>?)" }
  }
  
  return { isValid: true }
}

function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Некорректный формат email адреса" }
  }
  
  if (email.length > 254) {
    return { isValid: false, error: "Email адрес слишком длинный" }
  }
  
  return { isValid: true }
}

function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (username.length < 3) {
    return { isValid: false, error: "Имя пользователя должно содержать минимум 3 символа" }
  }
  
  if (username.length > 30) {
    return { isValid: false, error: "Имя пользователя не должно превышать 30 символов" }
  }
  
  // Проверяем, что username содержит только буквы, цифры, дефисы и подчеркивания
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: "Имя пользователя может содержать только буквы, цифры, дефисы (-) и подчеркивания (_)" }
  }
  
  // Проверяем, что username не начинается с цифры
  if (/^\d/.test(username)) {
    return { isValid: false, error: "Имя пользователя не может начинаться с цифры" }
  }
  
  return { isValid: true }
}

// Серверные версии функций управления пользователями
export function serverGetAllUsers(): PublicUser[] {
  return serverUsers.map(toPublic)
}

export async function serverCreateUser(input: {
  username: string
  email: string
  password: string
  role: Role
  phone?: string
  messenger?: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { username, email, password, role, phone, messenger } = input

  console.log(`[DEBUG] Creating user: ${username} (${email})`)

  // Базовая проверка на пустые поля
  if (!username.trim() || !email.trim() || !password.trim()) {
    return { ok: false, error: "Заполните обязательные поля." }
  }

  // Валидация username
  const usernameValidation = validateUsername(username.trim())
  if (!usernameValidation.isValid) {
    return { ok: false, error: usernameValidation.error! }
  }

  // Валидация email
  const emailValidation = validateEmail(email.trim())
  if (!emailValidation.isValid) {
    return { ok: false, error: emailValidation.error! }
  }

  // Валидация пароля
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { ok: false, error: passwordValidation.error! }
  }

  // Проверяем уникальность username
  const existingUsername = serverUsers.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())
  if (existingUsername) {
    return { ok: false, error: "Такое имя пользователя уже занято." }
  }

  // Проверяем уникальность email
  const existingEmail = serverUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (existingEmail) {
    return { ok: false, error: "Такой email адрес уже зарегистрирован." }
  }

  // Создаем пользователя
  const passwordHash = await hashPassword(password)
  const u: StoredUser = {
    id: `user-${Date.now()}`,
    username: username.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    messenger: messenger?.trim(),
    role,
    permissions: getDefaultPermissionsForRole(role),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passwordHash,
  }
  serverUsers.push(u)
  
  // Сохраняем в файл
  saveUsersToFile(serverUsers)
  
  console.log(`[DEBUG] User created successfully. Total users: ${serverUsers.length}`)
  console.log(`[DEBUG] All users:`, serverUsers.map(u => ({ username: u.username, email: u.email, active: u.active })))
  
  return { ok: true, user: toPublic(u) }
}

export function serverUpdateUserRole(id: string, newRole: Role): { ok: boolean; error?: string } {
  const idx = serverUsers.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  
  // Защита главного суперадмина
  if (serverUsers[idx].isMainSuperadmin) {
    return { ok: false, error: "Нельзя изменить роль главного суперадмина" }
  }
  
  // Защита от понижения суперадмина до обычного админа
  if (serverUsers[idx].role === "superadmin" && newRole !== "superadmin") {
    return { ok: false, error: "Нельзя понизить роль суперадмина" }
  }
  
  serverUsers[idx].role = newRole
  serverUsers[idx].permissions = getDefaultPermissionsForRole(newRole)
  serverUsers[idx].updatedAt = new Date().toISOString()
  
  // Сохраняем в файл
  saveUsersToFile(serverUsers)
  
  return { ok: true }
}

export function serverSetActive(id: string, active: boolean): { ok: boolean; error?: string } {
  const idx = serverUsers.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  
  // Защита главного суперадмина
  if (serverUsers[idx].isMainSuperadmin) {
    return { ok: false, error: "Нельзя деактивировать главного суперадмина" }
  }
  
  serverUsers[idx].active = active
  serverUsers[idx].updatedAt = new Date().toISOString()
  
  // Сохраняем в файл
  saveUsersToFile(serverUsers)
  
  return { ok: true }
}

export function serverDeleteUser(id: string): { ok: boolean; deletedUserEmail?: string; error?: string } {
  const userToDelete = serverUsers.find((u) => u.id === id)
  if (!userToDelete) {
    return { ok: false, error: "Пользователь не найден" }
  }
  
  // Защита главного суперадмина
  if (userToDelete.isMainSuperadmin) {
    return { ok: false, error: "Нельзя удалить главного суперадмина" }
  }
  
  const deletedUserEmail = userToDelete.email
  serverUsers = serverUsers.filter((u) => u.id !== id)
  
  // Сохраняем в файл
  saveUsersToFile(serverUsers)
  
  return { ok: true, deletedUserEmail }
}

export function serverUpdateUserPermissions(id: string, permissions: Permission[]): { ok: boolean; error?: string } {
  const idx = serverUsers.findIndex((u) => u.id === id)
  if (idx === -1) return { ok: false, error: "Пользователь не найден" }
  
  // Защита главного суперадмина
  if (serverUsers[idx].isMainSuperadmin) {
    return { ok: false, error: "Нельзя изменять разрешения главного суперадмина" }
  }
  
  // Защита суперадминов (но не главного)
  if (serverUsers[idx].role === "superadmin") {
    return { ok: false, error: "Нельзя изменять разрешения суперадмина" }
  }
  
  serverUsers[idx].permissions = permissions
  serverUsers[idx].updatedAt = new Date().toISOString()
  
  // Сохраняем в файл
  saveUsersToFile(serverUsers)
  
  return { ok: true }
}
