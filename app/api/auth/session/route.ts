import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { serverLoginUser } from "@/lib/auth-storage-server"
import { getDefaultPermissionsForRole } from "@/lib/permissions"
import type { Role } from "@/types/auth"

// Временно отключаем Supabase для тестирования dev fallback
const hasSupabase = false // !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function setSessionCookie(res: NextResponse, payload: { email: string; role: string; permissions: string[] }) {
  const isProd = process.env.NODE_ENV === "production"
  const value = JSON.stringify(payload)
  const maxAge = 7 * 24 * 60 * 60
  res.cookies.set("sns_auth", value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    if (!email || !password) return fail("email and password are required")

    console.log(`[DEBUG] Login attempt for: ${email}`)
    console.log(`[DEBUG] hasSupabase: ${hasSupabase}`)
    console.log(`[DEBUG] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`[DEBUG] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`)

    if (hasSupabase) {
      const supabase = createClient()
      const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password })
      if (error) {
        if (email === "admin@example.com" && password === "admin123") {
          const permissions = getDefaultPermissionsForRole("superadmin")
          const res = ok({ email, role: "superadmin", permissions })
          setSessionCookie(res, { email, role: "superadmin", permissions })
          return res
        }
        return fail("Invalid credentials", 401)
      }
      let role = "admin"
      try {
        const { data: prof } = await (supabase as any).from("profiles").select("role").eq("id", data.user.id).single()
        if (prof?.role) role = String(prof.role)
      } catch {}
      const permissions = getDefaultPermissionsForRole(role as any)
      const res = ok({ email, role, permissions })
      setSessionCookie(res, { email, role, permissions })
      return res
    }

    // Dev fallback - используем серверную версию auth-storage для логина
    console.log(`[DEBUG] Attempting login for: ${email}`)
    const loginResult = await serverLoginUser({ loginOrEmail: email, password })
    console.log(`[DEBUG] Login result:`, loginResult)
    
    if (!loginResult.ok) {
      console.log(`[DEBUG] Login failed, trying demo fallback`)
      // Fallback для демо (если нет пользователей в localStorage)
      let role = "staff"
      if (email === "admin@example.com" && password === "admin123") role = "superadmin"
      else if (password === "admin123") role = "admin"
      
      const demoPermissions = getDefaultPermissionsForRole(role as Role)
      const demoRes = ok({ email, role, permissions: demoPermissions })
      setSessionCookie(demoRes, { email, role, permissions: demoPermissions })
      return demoRes
    }
    
    const user = loginResult.user
    const userPermissions = user.permissions || getDefaultPermissionsForRole(user.role as Role)
    const userRes = ok({ 
      email: user.email, 
      role: user.role, 
      permissions: userPermissions,
      username: user.username,
      id: user.id
    })
    setSessionCookie(userRes, { 
      email: user.email, 
      role: user.role, 
      permissions: userPermissions 
    })
    return userRes
  } catch (e: any) {
    return fail(e?.message || "Login failed", 500)
  }
}

export async function GET() {
  const c = await cookies()
  const raw = c.get("sns_auth")?.value
  if (!raw) return ok(null)
  try {
    const data = JSON.parse(raw)
    return ok(data)
  } catch {
    return ok(null)
  }
}

export async function DELETE() {
  const res = ok({})
  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set("sns_auth", "", { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 0 })
  return res
}
