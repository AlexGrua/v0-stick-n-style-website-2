import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function readAuth(req: NextRequest): { role?: string } | null {
  const auth = req.cookies.get("sns_auth")?.value
  if (!auth) return null
  const role = req.cookies.get("sns_role")?.value
  return { role }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const a = readAuth(req)
    if (!a?.role) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = `?returnTo=${encodeURIComponent(pathname + (search || ""))}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
