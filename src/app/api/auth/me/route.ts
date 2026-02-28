import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureProfile } from '@/lib/profile-storage';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error retrieving user in /api/auth/me:', error);
      return NextResponse.json(
        { user: null, isAdmin: false, error: error.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { user: null, isAdmin: false },
        { status: 401 }
      );
    }

    const isAdmin = adminEmails.includes(
      (user.email ?? '').toLowerCase()
    );

    // Ensure user profile exists on every auth check (creates on first login)
    try {
      await ensureProfile(user.id, user.email || '');
    } catch (err) {
      // Profile creation failure should not block auth response
      console.error('Failed to ensure profile for user:', user.id, err);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split('@')[0] ??
          '',
        image:
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          null,
        role: isAdmin ? 'admin' : 'user',
      },
      isAdmin,
    });
  } catch (err) {
    console.error('Unexpected error in /api/auth/me:', err);
    return NextResponse.json(
      { user: null, isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
