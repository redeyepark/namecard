import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Routes that do not require authentication
const publicRoutes = ['/', '/login'];
const publicPrefixes = ['/api/auth/', '/_next/', '/favicon.ico'];

// Routes that require admin role
const adminPrefixes = ['/admin'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow routes with public prefixes
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const isLoggedIn = !!req.auth;

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAdminRoute && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
