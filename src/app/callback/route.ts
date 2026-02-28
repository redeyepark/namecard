import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Handle Supabase OAuth callback.
 * Exchanges the authorization code for a session and redirects
 * the user to the requested page or home.
 */
/**
 * Validate redirect URL to prevent open redirect attacks.
 * Only allows relative paths starting with "/" (rejects protocol-relative "//").
 */
function getSafeRedirectPath(url: string | null, fallback: string): string {
  if (!url) return fallback;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'), '/');

  if (code) {
    const cookieStore = await cookies();
    let response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              // Set cookies in cookie store
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
              // CRITICAL FIX: Also set cookies on the response object
              // This ensures auth session cookies are sent to the client
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            } catch (err) {
              console.error('Error setting auth cookies in callback:', err);
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  // If there's no code or an error occurred, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
