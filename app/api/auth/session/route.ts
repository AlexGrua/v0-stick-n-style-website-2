import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

function ok(data: any, setCookie?: string) {
  const res = NextResponse.json({ success: true, data })
  if (setCookie) res.headers.set("Set-Cookie", setCookie)
  return res
}
function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function makeCookie(payload: { email: string; role: string }) {
  const value = encodeURIComponent(JSON.stringify(payload))
  // 7 days
  const maxAge = 7 * 24 * 60 * 60
  return `sns_auth=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    if (!email || !password) return fail("email and password are required")

    if (hasSupabase) {
      const supabase = createClient()
      const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password })
      if (error) {
        // Demo fallback: allow admin@example.com / admin123 even if Supabase user is missing
        if (email === "admin@example.com" && password === "admin123") {
          const setCookie = makeCookie({ email, role: "superadmin" })
          return ok({ email, role: "superadmin" }, setCookie)
        }
        return fail("Invalid credentials", 401)
      }
      // fetch role from profiles table if exists, otherwise default admin
      let role = "admin"
      try {
        const { data: prof } = await (supabase as any).from("profiles").select("role").eq("id", data.user.id).single()
        if (prof?.role) role = String(prof.role)
      } catch {}
      const setCookie = makeCookie({ email, role })
      return ok({ email, role }, setCookie)
    }

    // Fallback (dev): simple canned users
    let role = "staff"
    if (email === "admin@example.com" && password === "admin123") role = "superadmin"
    else if (password === "demo123") role = "staff"
    else if (password === "admin123") role = "admin"
    const setCookie = makeCookie({ email, role })
    return ok({ email, role }, setCookie)
  } catch (e: any) {
    return fail(e?.message || "Login failed", 500)
  }
}

export async function GET() {
  const c = await cookies()
  const raw = c.get("sns_auth")?.value
  if (!raw) return ok(null)
  try {
    const data = JSON.parse(decodeURIComponent(raw))
    return ok(data)
  } catch {
    return ok(null)
  }
}

export async function DELETE() {
  const res = ok({})
  res.headers.set("Set-Cookie", "sns_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
  return res
}