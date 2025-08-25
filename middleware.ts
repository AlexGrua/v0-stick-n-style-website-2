import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  // защищаем ТОЛЬКО страницы админки; API не трогаем
  matcher: ['/admin/:path*'],
};

function parseAuth(raw?: string | null) {
  if (!raw) return null;
  try { 
    return JSON.parse(raw);
  } catch { return null; }
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isLogin = url.pathname.startsWith('/admin/login');
  if (isLogin) return NextResponse.next();

  const raw = req.cookies.get('sns_auth')?.value || null;
  console.log(`[MIDDLEWARE] Path: ${url.pathname}, Cookie: ${raw ? 'present' : 'missing'}`);
  const session = parseAuth(raw);
  console.log(`[MIDDLEWARE] Session:`, session);

  if (!session) {
    console.log(`[MIDDLEWARE] No session, redirecting to login`);
    const login = new URL('/admin/login', url);
    login.searchParams.set('next', url.pathname + url.search);
    return NextResponse.redirect(login);
  }
  console.log(`[MIDDLEWARE] Session OK, proceeding`);
  return NextResponse.next();
}
