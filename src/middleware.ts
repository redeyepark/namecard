import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that do not require authentication
const publicRoutes = ['/', '/login', '/signup', '/callback', '/confirm', '/cards', '/api/cards', '/api/feed', '/api/bookmarks'];
const publicPrefixes = ['/_next/', '/favicon.ico', '/api/auth/', '/cards/', '/api/cards/', '/profile/', '/api/profiles/', '/api/feed', '/api/bookmarks'];

// Routes that require admin role (cookie-based auth)
const adminPrefixes = ['/admin'];
// Admin routes that do not require admin cookie
const adminPublicRoutes = ['/admin/login'];
// Admin API routes that handle their own auth
const adminApiPrefixes = ['/api/admin/'];

// Protected routes that require Supabase authentication
const protectedRoutes = ['/create', '/create/edit', '/dashboard'];

// Expected admin token cookie value
const ADMIN_TOKEN_VALUE = 'admin_authenticated_a12345';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let response = NextResponse.next({
    request: req,
  });

  // Allow admin API routes (they handle their own auth)
  for (const prefix of adminApiPrefixes) {
    if (pathname.startsWith(prefix)) {
      return response;
    }
  }

  // Check if this is an admin route
  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Handle admin routes with cookie-based auth (no Supabase needed)
  if (isAdminRoute) {
    // Allow admin login page without cookie
    if (adminPublicRoutes.includes(pathname)) {
      return response;
    }

    // Check admin-token cookie
    const adminToken = req.cookies.get('admin-token');
    if (!adminToken || adminToken.value !== ADMIN_TOKEN_VALUE) {
      return NextResponse.redirect(
        new URL('/admin/login', req.nextUrl.origin)
      );
    }

    return response;
  }

  // --- Below: Supabase auth for non-admin routes (unchanged) ---

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

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
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
