'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import BottomNav from '@/components/navigation/BottomNav';
import type { ReactNode } from 'react';

/** Pages where the bottom nav should NOT be shown */
const HIDDEN_PATH_PREFIXES = ['/admin', '/login', '/signup', '/callback'];

/**
 * Client-side layout shell that wraps page content with bottom-nav padding
 * and renders the BottomNav component for authenticated users on eligible pages.
 */
export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isHiddenPage = HIDDEN_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Show bottom nav only for authenticated users on non-excluded pages
  const showBottomNav = !isLoading && !!user && !isHiddenPage;

  return (
    <>
      <div className={showBottomNav ? 'has-bottom-nav' : ''}>
        {children}
      </div>
      <BottomNav />
    </>
  );
}
