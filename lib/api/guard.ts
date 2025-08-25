import { cookies } from "next/headers"
import type { Permission } from "@/types/auth"

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(/;\s*/).forEach((pair) => {
    const idx = pair.indexOf("=")
    if (idx > -1) {
      const k = pair.slice(0, idx).trim()
      const v = pair.slice(idx + 1)
      out[k] = v
    }
  })
  return out
}

export type Role = "staff" | "admin" | "superadmin"

export function readAuthFromRequest(req: Request): { email?: string; role?: Role; permissions?: Permission[] } | null {
  // Сначала проверяем cookies
  const cookieHeader = req.headers.get("cookie")
  const jar = parseCookies(cookieHeader)
  const raw = jar["sns_auth"]
  if (raw) {
    try {
      // JSON
      try {
        const data = JSON.parse(raw)
        return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
      } catch {}
      // URI-encoded JSON
      try {
        const data = JSON.parse(decodeURIComponent(raw))
        return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
      } catch {}
      // base64url(JSON)
      const decoded = Buffer.from(raw, "base64url").toString("utf8")
      const data = JSON.parse(decoded)
      return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
    } catch (e) {
      // Игнорируем ошибки парсинга cookies
    }
  }
  // Затем проверяем заголовок Authorization
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    try {
      // JSON
      try {
        const data = JSON.parse(token)
        return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
      } catch {}
      // URI-encoded JSON
      try {
        const data = JSON.parse(decodeURIComponent(token))
        return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
      } catch {}
      // base64url(JSON)
      const decoded = Buffer.from(token, "base64url").toString("utf8")
      const data = JSON.parse(decoded)
      return { email: data?.email, role: data?.role as Role, permissions: data?.permissions as Permission[] }
    } catch {
      // Игнорируем ошибки парсинга токена
    }
  }
  return null
}

export function requireRole(
  request: Request,
  minimumRole: Role,
  requiredPermission?: Permission
): { ok: true; user: { email: string; role: Role; permissions: Permission[] } } | { ok: false; message: string; status: number } {
  const auth = readAuthFromRequest(request)
  if (!auth?.email) {
    return { ok: false, message: "Unauthorized", status: 401 }
  }

  const { email, role, permissions } = auth

  // superadmin имеет все права
  if (role === "superadmin") {
    return { ok: true, user: { email, role: role as Role, permissions: permissions || [] } }
  }

  // Проверяем роль
  const roleHierarchy = { staff: 1, admin: 2, superadmin: 3 }
  const userLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[minimumRole] || 0

  if (userLevel < requiredLevel) {
    return { ok: false, message: "Insufficient role", status: 403 }
  }

  // Если требуется конкретное разрешение, проверяем его
  if (requiredPermission && permissions) {
    if (!permissions.includes(requiredPermission)) {
      return { ok: false, message: "Insufficient permissions", status: 403 }
    }
  }

  return { ok: true, user: { email, role: role as Role, permissions: permissions || [] } }
}

// Удобные функции для проверки конкретных разрешений
export function requirePermission(
  request: Request,
  permission: Permission
): { ok: true; user: { email: string; role: Role; permissions: Permission[] } } | { ok: false; message: string; status: number } {
  return requireRole(request, "staff", permission)
}

export function requireAnyPermission(
  request: Request,
  permissions: Permission[]
): { ok: true; user: { email: string; role: Role; permissions: Permission[] } } | { ok: false; message: string; status: number } {
  const auth = readAuthFromRequest(request)
  if (!auth?.email) {
    return { ok: false, message: "Unauthorized", status: 401 }
  }

  const { email, role, permissions: userPermissions } = auth

  // superadmin имеет все права
  if (role === "superadmin") {
    return { ok: true, user: { email, role: role as Role, permissions: userPermissions || [] } }
  }

  // Проверяем, есть ли хотя бы одно из требуемых разрешений
  if (userPermissions && permissions.some(permission => userPermissions.includes(permission))) {
    return { ok: true, user: { email, role: role as Role, permissions: userPermissions } }
  }

  return { ok: false, message: "Insufficient permissions", status: 403 }
}