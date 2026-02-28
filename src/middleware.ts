import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that do not require authentication
const publicRoutes = ['/', '/login', '/signup', '/callback', '/confirm', '/cards', '/api/cards', '/api/feed', '/api/bookmarks', '/reset-password', '/reset-password/confirm'];
const publicPrefixes = ['/_next/', '/favicon.ico', '/api/auth/', '/cards/', '/api/cards/', '/profile/', '/api/profiles/', '/api/feed', '/api/bookmarks'];

// Routes that require admin role (cookie-based auth)
const adminPrefixes = ['/admin'];
// Admin routes that do not require admin cookie
const adminPublicRoutes = ['/admin/login'];
// Admin API routes that handle their own auth
const adminApiPrefixes = ['/api/admin/'];

// Protected routes that require Supabase authentication
const protectedRoutes = ['/create', '/create/edit', '/dashboard'];

// Admin token value from environment variable (never hardcode secrets in source)
const ADMIN_TOKEN_VALUE = process.env.ADMIN_TOKEN_VALUE || '';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let response = NextResponse.next({
    request: req,
  });

  // Protect admin API routes with admin token validation (except login endpoint)
  for (const prefix of adminApiPrefixes) {
    if (pathname.startsWith(prefix)) {
      // Allow admin login endpoint without token
      if (pathname.startsWith('/api/admin/login')) {
        return response;
      }
      // Verify admin token for all other admin API routes
      const adminToken = req.cookies.get('admin-token');
      if (!ADMIN_TOKEN_VALUE || !adminToken || adminToken.value !== ADMIN_TOKEN_VALUE) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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
    // Reject if ADMIN_TOKEN_VALUE is not configured (empty string guard)
    const adminToken = req.cookies.get('admin-token');
    if (!ADMIN_TOKEN_VALUE || !adminToken || adminToken.value !== ADMIN_TOKEN_VALUE) {
      return NextResponse.redirect(
        new URL('/admin/login', req.nextUrl.origin)
      );
    }

    return response;
  }

  // --- Below: Supabase auth for non-admin routes (unchanged) ---

  // Create a Supabase client for the middleware.
  // This refreshes the auth token on every request via cookie management.
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies for server-side operations
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          // CRITICAL FIX: Create new response with updated cookies
          // This ensures refreshed tokens are sent back to the client
          supabaseResponse = NextResponse.next({
            request: req,
          });
          // Set cookies on the response so client receives updated tokens
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session by calling getUser().
  // IMPORTANT: Do not use getSession() - only getUser() sends a request to
  // the Supabase Auth server to revalidate the token.
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err) {
    console.error('Error refreshing auth session in middleware:', err);
    // Continue without user - let client handle logout
  }

  // Use the response that may have been updated by setAll callback
  response = supabaseResponse;

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
