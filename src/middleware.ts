import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that do not require authentication
const publicRoutes = ['/', '/login', '/signup', '/callback', '/confirm'];
const publicPrefixes = ['/_next/', '/favicon.ico', '/api/auth/'];

// Routes that require admin role
const adminPrefixes = ['/admin'];

// Protected routes that require authentication
const protectedRoutes = ['/create', '/create/edit'];

/**
 * Check if an email address is in the ADMIN_EMAILS whitelist.
 */
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let response = NextResponse.next({
    request: req,
  });

  // Create a Supabase client for the middleware.
  // This refreshes the auth token on every request via cookie management.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session by calling getUser().
  // IMPORTANT: Do not use getSession() - only getUser() sends a request to
  // the Supabase Auth server to revalidate the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // Allow routes with public prefixes
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return response;
    }
  }

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Redirect unauthenticated users to login
  if (!user && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  if (isAdminRoute && user) {
    if (!user.email || !isAdmin(user.email)) {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  return response;
}

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
