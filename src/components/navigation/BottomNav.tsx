'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, Bookmark, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { LucideIcon } from 'lucide-react';

interface NavTab {
  label: string;
  icon: LucideIcon;
  route: string;
  matchType: 'startsWith' | 'exact';
}

const LEFT_TABS: NavTab[] = [
  { label: '\uD64C', icon: Home, route: '/dashboard', matchType: 'startsWith' },
  { label: '\uAC24\uB7EC\uB9AC', icon: LayoutGrid, route: '/cards', matchType: 'startsWith' },
];

const RIGHT_TABS: NavTab[] = [
  { label: '\uBD81\uB9C8\uD06C', icon: Bookmark, route: '/dashboard/bookmarks', matchType: 'exact' },
  { label: '\uB0B4\uC815\uBCF4', icon: User, route: '/profile', matchType: 'startsWith' },
];

/** Pages where the bottom nav should NOT be shown */
const HIDDEN_PATH_PREFIXES = ['/admin', '/login', '/signup', '/callback'];

function isTabActive(
  pathname: string,
  route: string,
  matchType: 'startsWith' | 'exact',
): boolean {
  if (matchType === 'exact') {
    return pathname === route;
  }
  return pathname.startsWith(route);
}

function NavItem({ tab, pathname }: { tab: NavTab; pathname: string }) {
  const Icon = tab.icon;
  const active = isTabActive(pathname, tab.route, tab.matchType);

  return (
    <Link
      href={tab.route}
      className={`bottom-nav-item${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon aria-hidden="true" />
      <span>{tab.label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Do not render while auth is loading
  if (isLoading) return null;

  // Do not render for unauthenticated users
  if (!user) return null;

  // Do not render on excluded pages
  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      className="bottom-nav md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {LEFT_TABS.map((tab) => (
        <NavItem key={tab.route} tab={tab} pathname={pathname} />
      ))}

      {/* Create - center FAB button */}
      <Link
        href="/create"
        className="bottom-nav-create"
        aria-label="\uB9CC\uB4E4\uAE30"
      >
        <Plus aria-hidden="true" />
      </Link>

      {RIGHT_TABS.map((tab) => (
        <NavItem key={tab.route} tab={tab} pathname={pathname} />
      ))}
    </nav>
  );
}
