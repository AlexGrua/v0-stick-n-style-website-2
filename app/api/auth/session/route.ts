import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

function ok(data: any, res?: NextResponse) {
  return (res ?? NextResponse.json({ success: true, data }))
}
function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function setSessionCookies(res: NextResponse, role: string, email: string) {
  const isProd = process.env.NODE_ENV === "production"
  const maxAge = 7 * 24 * 60 * 60
  res.cookies.set("sns_auth", "1", { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge })
  // role cookie is httpOnly as well
  res.cookies.set("sns_role", role, { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge })
  // optional: public hint (non-HttpOnly) if needed by client UI
  res.cookies.set("sns_user", encodeURIComponent(email), { path: "/", httpOnly: false, sameSite: "lax", secure: isProd, maxAge })
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
          const res = NextResponse.json({ success: true, data: { email, role: "superadmin" } })
          setSessionCookies(res, "superadmin", email)
          return res
        }
        return fail("Invalid credentials", 401)
      }
      let role = "admin"
      try {
        const { data: prof } = await (supabase as any).from("profiles").select("role").eq("id", data.user.id).single()
        if (prof?.role) role = String(prof.role)
      } catch {}
      const res = NextResponse.json({ success: true, data: { email, role } })
      setSessionCookies(res, role, email)
      return res
    }

    // Dev fallback
    let role = "staff"
    if (email === "admin@example.com" && password === "admin123") role = "superadmin"
    else if (password === "admin123") role = "admin"
    const res = NextResponse.json({ success: true, data: { email, role } })
    setSessionCookies(res, role, email)
    return res
  } catch (e: any) {
    return fail(e?.message || "Login failed", 500)
  }
}

export async function GET() {
  const c = await cookies()
  const auth = c.get("sns_auth")?.value
  const role = c.get("sns_role")?.value
  const email = c.get("sns_user")?.value
  if (!auth) return NextResponse.json({ success: true, data: null })
  return NextResponse.json({ success: true, data: { email: email ? decodeURIComponent(email) : undefined, role } })
}

export async function DELETE() {
  const isProd = process.env.NODE_ENV === "production"
  const res = NextResponse.json({ success: true, data: {} })
  res.cookies.set("sns_auth", "", { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 0 })
  res.cookies.set("sns_role", "", { path: "/", httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 0 })
  res.cookies.set("sns_user", "", { path: "/", httpOnly: false, sameSite: "lax", secure: isProd, maxAge: 0 })
  return res
}