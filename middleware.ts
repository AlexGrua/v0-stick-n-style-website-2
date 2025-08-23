import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cookie value is URI-encoded JSON: { email, role }
function parseAuthCookie(req: NextRequest): { email?: string; role?: string } | null {
  const raw = req.cookies.get("sns_auth")?.value
  if (!raw) return null
  try {
    const json = decodeURIComponent(raw)
    const data = JSON.parse(json)
    return typeof data === "object" && data ? data : null
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Protect all admin routes except the login page
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const auth = parseAuthCookie(req)
    if (!auth?.email || !auth?.role) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = `?returnTo=${encodeURIComponent(pathname + (search || ""))}`
      return NextResponse.redirect(url)
    }
    // Future: route-level role checks can go here
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}