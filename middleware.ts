import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Add quiz path to public paths
  const isPublicPath = req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/quiz';
  const token = await getToken({ req });
  const isAuth = !!token;

  // Allow public access to quiz page
  if (req.nextUrl.pathname === '/quiz') {
    return NextResponse.next();
  }

  // Handle auth page
  if (isPublicPath) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return null;
  }

  // Redirect unauthenticated users to login page for protected routes
  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  return NextResponse.next();
}

// Update matcher to exclude quiz path
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     * 6. /quiz (public quiz page)
     */
    '/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml|quiz).*)',
  ],
}; 