import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// Korean error messages for auth responses
export const AUTH_ERRORS = {
  UNAUTHORIZED: '인증이 필요합니다. 로그인해 주세요.',
  FORBIDDEN: '접근 권한이 없습니다.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  INVALID_TOKEN: '유효하지 않은 인증 토큰입니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
} as const;

/**
 * Create a Supabase server client for use in Server Components and API routes.
 * Reads/writes cookies from the Next.js cookie store.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the currently authenticated Supabase user on the server side.
 * Returns the user object or null if not authenticated.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Require authentication. Returns the user or throws an auth error response.
 * Use in API routes that require a logged-in user.
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    throw new AuthError(AUTH_ERRORS.UNAUTHORIZED, 401);
  }

  return user;
}

/**
 * Require admin role. Returns the user or throws an auth error response.
 * Checks user email against the ADMIN_EMAILS environment variable.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (!user.email || !isAdmin(user.email)) {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }

  return user;
}

/**
 * Check if an email address is in the ADMIN_EMAILS whitelist.
 */
export function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}

/**
 * Check if the admin-token cookie is valid.
 * Validates against the ADMIN_TOKEN_VALUE environment variable.
 * Returns false if the env var is not set (never allows empty token match).
 */
export async function isAdminTokenValid(): Promise<boolean> {
  const ADMIN_TOKEN_VALUE = process.env.ADMIN_TOKEN_VALUE;
  if (!ADMIN_TOKEN_VALUE) {
    console.error('[auth-utils] ADMIN_TOKEN_VALUE environment variable is not set');
    return false;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');
  return token?.value === ADMIN_TOKEN_VALUE;
}

/**
 * Require a valid admin token cookie. Throws AuthError if missing/invalid.
 * Use in API routes that require admin access via password-based auth.
 */
export async function requireAdminToken(): Promise<void> {
  const valid = await isAdminTokenValid();
  if (!valid) {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }
}

/**
 * Custom error class for authentication/authorization failures.
 * Carries an HTTP status code for use in API route error responses.
 */
export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
