'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCoffeeChatCount } from '@/hooks/useCoffeeChatCount';
import CoffeeChatBadge from '@/components/coffee-chat/CoffeeChatBadge';

const NAV_ITEMS = [
  { label: '질문', href: '/community/questions' },
  { label: '설문', href: '/community/surveys' },
  { label: '커피챗', href: '/community/coffee-chat' },
];

export function CommunityNav() {
  const pathname = usePathname();
  const { count } = useCoffeeChatCount();

  return (
    <nav className="flex border-b border-border-medium">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              isActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-primary/40 hover:text-primary/70'
            }`}
          >
            {item.label}
            {item.href === '/community/coffee-chat' && (
              <CoffeeChatBadge count={count} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
