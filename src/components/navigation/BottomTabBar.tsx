'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCoffeeChatCountContext } from './CoffeeChatCountProvider';
import NavBadge from './NavBadge';

// Heroicons outline style SVG icons (24x24)
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={active ? 2 : 1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={active ? 2 : 1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={active ? 2 : 1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={active ? 2 : 1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

interface TabItem {
  key: string;
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  matchPrefix: string;
  badge?: boolean;
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCoffeeChatCountContext();

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: '\uD648',
      href: '/cards',
      icon: HomeIcon,
      matchPrefix: '/cards',
    },
    {
      key: 'community',
      label: '\uCEE4\uBBA4\uB2C8\uD2F0',
      href: '/community/questions',
      icon: CommunityIcon,
      matchPrefix: '/community',
      badge: true,
    },
    {
      key: 'sub-cards',
      label: '\uBD80\uCE90\uAD00\uB9AC',
      href: '/dashboard',
      icon: DashboardIcon,
      matchPrefix: '/dashboard',
    },
    {
      key: 'profile',
      label: '\uD504\uB85C\uD544',
      href: user ? `/profile/${user.id}` : '/profile',
      icon: ProfileIcon,
      matchPrefix: '/profile',
    },
  ];

  const isActive = (matchPrefix: string) => {
    return pathname.startsWith(matchPrefix);
  };

  return (
    <nav
      role="navigation"
      aria-label="\uC8FC \uB0B4\uBE44\uAC8C\uC774\uC158"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#fcfcfc] border-t"
      style={{
        borderColor: 'rgba(2, 9, 18, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.matchPrefix);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center flex-1 py-2 min-h-[44px] min-w-[44px]
                transition-colors duration-150
                ${
                  active
                    ? 'text-[#020912] border-t-2 border-[#020912]'
                    : 'text-[#020912]/40 border-t-2 border-transparent'
                }
              `}
            >
              <span className="relative">
                {tab.icon({ active })}
                {tab.badge && count > 0 && (
                  <span className="absolute -top-1 -right-2">
                    <NavBadge count={count} />
                  </span>
                )}
              </span>
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
