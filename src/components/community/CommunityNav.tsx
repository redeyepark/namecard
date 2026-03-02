'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '질문', href: '/community/questions' },
  { label: '커피챗', href: '/community/coffee-chat', disabled: true },
];

export function CommunityNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b border-[rgba(2,9,18,0.15)]">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);

        if (item.disabled) {
          return (
            <span
              key={item.href}
              className="px-4 py-3 text-sm font-medium text-[#020912]/20 cursor-not-allowed"
            >
              {item.label}
              <span className="ml-1 text-[10px]">soon</span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-[#020912] border-b-2 border-[#020912]'
                : 'text-[#020912]/40 hover:text-[#020912]/70'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
