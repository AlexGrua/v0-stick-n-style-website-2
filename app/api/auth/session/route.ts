import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function setSessionCookie(res: NextResponse, payload: { email: string; role: string }) {
  const isProd = process.env.NODE_ENV === "production"
  const value = encodeURIComponent(JSON.stringify(payload))
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

    if (hasSupabase) {
      const supabase = createClient()
      const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password })
      if (error) {
        if (email === "admin@example.com" && password === "admin123") {
          const res = ok({ email, role: "superadmin" })
          setSessionCookie(res, { email, role: "superadmin" })
          return res
        }
        return fail("Invalid credentials", 401)
      }
      let role = "admin"
      try {
        const { data: prof } = await (supabase as any).from("profiles").select("role").eq("id", data.user.id).single()
        if (prof?.role) role = String(prof.role)
      } catch {}
      const res = ok({ email, role })
      setSessionCookie(res, { email, role })
      return res
    }

    // Dev fallback
    let role = "staff"
    if (email === "admin@example.com" && password === "admin123") role = "superadmin"
    else if (password === "admin123") role = "admin"
    const res = ok({ email, role })
    setSessionCookie(res, { email, role })
    return res
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
  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set("sns_auth", "", { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 0 })
  return res
}
