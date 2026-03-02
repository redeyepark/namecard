'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import CoffeeChatCountProvider from './CoffeeChatCountProvider';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';

// Routes where navigation should be completely hidden
const HIDDEN_ROUTES = ['/login', '/signup', '/confirm', '/callback', '/reset-password'];

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isAuthRoute(pathname: string): boolean {
  return HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

function isLandingPage(pathname: string): boolean {
  return pathname === '/';
}

function isPublicViewablePage(pathname: string): boolean {
  return (
    pathname.startsWith('/cards') ||
    pathname.startsWith('/profile/')
  );
}

function NavigationContent() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Admin pages: render NOTHING
  if (isAdminRoute(pathname)) return null;

  // Auth pages: render NOTHING
  if (isAuthRoute(pathname)) return null;

  // Still loading auth state - show TopNav skeleton only (avoid flash)
  if (isLoading) {
    return <TopNav />;
  }

  // Unauthenticated + landing page: render NOTHING
  if (!user && isLandingPage(pathname)) return null;

  // Unauthenticated + public pages: render TopNav (minimal: logo + login)
  if (!user && isPublicViewablePage(pathname)) {
    return <TopNav />;
  }

  // Unauthenticated + any other page: render NOTHING
  if (!user) return null;

  // Authenticated + any non-admin page: render TopNav (full) + BottomTabBar
  return (
    <>
      <TopNav />
      <BottomTabBar />
    </>
  );
}

export default function GlobalNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Quick bail for admin and auth routes (no provider needed)
  if (isAdminRoute(pathname) || isAuthRoute(pathname)) return null;

  // Wrap with CoffeeChatCountProvider only when authenticated
  if (!isLoading && user) {
    return (
      <CoffeeChatCountProvider>
        <NavigationContent />
        {/* Mobile bottom padding spacer when BottomTabBar is shown */}
        <div className="h-16 md:hidden" aria-hidden="true" />
      </CoffeeChatCountProvider>
    );
  }

  // Unauthenticated or loading: render without CoffeeChatCountProvider
  // CoffeeChatCountProvider defaults are safe (count: 0), so we can still use it
  // to avoid conditional hook issues in NavigationContent
  return (
    <CoffeeChatCountProvider>
      <NavigationContent />
    </CoffeeChatCountProvider>
  );
}
