'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-auth';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Build a partial AuthUser from the Supabase user object (without admin status)
function buildUserFromSupabase(supabaseUser: SupabaseUser): Omit<AuthUser, 'role'> {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name:
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      supabaseUser.email?.split('@')[0] ??
      '',
    image:
      supabaseUser.user_metadata?.avatar_url ??
      supabaseUser.user_metadata?.picture ??
      null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch admin status from server API and ensure profile exists
  const fetchUserInfo = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser({
          ...buildUserFromSupabase(supabaseUser),
          role: data.isAdmin ? 'admin' : 'user',
        });
      } else {
        // API failed but we still have the user, default to 'user' role
        setUser({
          ...buildUserFromSupabase(supabaseUser),
          role: 'user',
        });
      }

      // Ensure user profile exists (non-blocking, fire-and-forget).
      // The GET /api/profiles/me endpoint calls ensureProfile internally.
      fetch('/api/profiles/me').catch(() => {});
    } catch {
      // Network error, default to 'user' role
      setUser({
        ...buildUserFromSupabase(supabaseUser),
        role: 'user',
      });
    }
  }, []);

  useEffect(() => {
    // Get initial session and user from server
    // Use getUser() instead of getSession() to force server-side validation
    const initSession = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !currentUser) {
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }

        // Get session from auth state after confirming user exists
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        setSession(currentSession);
        await fetchUserInfo(currentUser);
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await fetchUserInfo(newSession.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
        await fetchUserInfo(newSession.user);
      }
    });

    // Handle visibility changes to refresh session when tab becomes active
    // This ensures the session is up-to-date when switching between browser tabs
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          // Attempt to refresh the session when tab becomes visible
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          if (currentUser) {
            await fetchUserInfo(currentUser);
          } else {
            setUser(null);
            setSession(null);
          }
        } catch (err) {
          console.error('Failed to refresh session on tab visibility:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUserInfo]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/');
  }, [router]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAdmin: user?.role === 'admin',
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
