export type Role = "staff" | "admin" | "superadmin"

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

export function readAuthFromRequest(req: Request): { email?: string; role?: Role } | null {
  const cookieHeader = req.headers.get("cookie")
  const jar = parseCookies(cookieHeader)
  const raw = jar["sns_auth"]
  if (!raw) return null
  try {
    const data = JSON.parse(decodeURIComponent(raw))
    return { email: data?.email, role: data?.role as Role }
  } catch {
    return null
  }
}

export function hasMinRole(userRole: Role | undefined, min: Role): boolean {
  const order: Record<Role, number> = { staff: 0, admin: 1, superadmin: 2 }
  const u = userRole ? order[userRole] ?? -1 : -1
  return u >= order[min]
}

export function requireRole(req: Request, min: Role = "admin"): { ok: true; role: Role } | { ok: false; status: number; message: string } {
  const auth = readAuthFromRequest(req)
  if (!auth?.role) return { ok: false, status: 401, message: "Unauthorized" }
  if (!hasMinRole(auth.role, min)) return { ok: false, status: 403, message: "Forbidden" }
  return { ok: true, role: auth.role }
}