'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCoffeeChatCountContext } from './CoffeeChatCountProvider';
import NavBadge from './NavBadge';
import UserMenuDropdown from './UserMenuDropdown';

interface NavLink {
  label: string;
  href: string;
  matchPrefix: string;
  showBadge?: boolean;
}

const navLinks: NavLink[] = [
  {
    label: '\uAC24\uB7EC\uB9AC',
    href: '/cards',
    matchPrefix: '/cards',
  },
  {
    label: '\uCEE4\uBBA4\uB2C8\uD2F0',
    href: '/community/questions',
    matchPrefix: '/community',
    showBadge: true,
  },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { count } = useCoffeeChatCountContext();

  const isActive = (matchPrefix: string) => {
    return pathname.startsWith(matchPrefix);
  };

  return (
    <header
      className="sticky top-0 z-40 hidden md:block w-full border-b"
      style={{
        backgroundColor: 'rgba(252, 252, 252, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderColor: 'rgba(2, 9, 18, 0.1)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left section: Logo + nav links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold text-[#020912] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Namecard
          </Link>

          {/* Nav links - only show when authenticated */}
          {user && (
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => {
                const active = isActive(link.matchPrefix);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      relative flex items-center gap-1.5 text-sm font-medium py-4 transition-colors duration-150
                      ${
                        active
                          ? 'text-[#020912] font-semibold'
                          : 'text-[#020912]/50 hover:text-[#020912]/80'
                      }
                    `}
                  >
                    {link.label}
                    {link.showBadge && count > 0 && (
                      <NavBadge count={count} />
                    )}
                    {/* Active bottom border indicator */}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#020912]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right section: User menu or login */}
        <div className="flex items-center">
          {isLoading ? (
            <div className="w-7 h-7 bg-gray-200 animate-pulse" style={{ borderRadius: '9999px' }} />
          ) : user ? (
            <UserMenuDropdown />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              {'\uB85C\uADF8\uC778'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
