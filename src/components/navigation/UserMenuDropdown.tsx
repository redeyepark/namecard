'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

interface MenuItem {
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: '\uB0B4 \uD504\uB85C\uD544', href: '' }, // href set dynamically
  { label: '\uB300\uC2DC\uBCF4\uB4DC', href: '/dashboard' },
  { label: '\uBD81\uB9C8\uD06C', href: '/dashboard/bookmarks' },
  { label: '\uC124\uC815', href: '/dashboard/settings' },
];

export default function UserMenuDropdown() {
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!user) return null;

  const resolvedItems = menuItems.map((item) =>
    item.label === '\uB0B4 \uD504\uB85C\uD544'
      ? { ...item, href: `/profile/${user.id}` }
      : item,
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 py-1 px-1.5 transition-colors duration-150 hover:bg-[#020912]/5"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar */}
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-7 h-7 object-cover"
            style={{ borderRadius: '9999px' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="flex items-center justify-center w-7 h-7 bg-[#e4f6ff] text-[#020912] text-xs font-semibold"
            style={{ borderRadius: '9999px' }}
          >
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        )}

        {/* Name */}
        <span className="text-sm font-medium text-[#020912] hidden sm:inline max-w-[120px] truncate">
          {user.name}
        </span>

        {/* Admin badge */}
        {isAdmin && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fcfcfc] bg-[#020912]">
            Admin
          </span>
        )}

        {/* Chevron */}
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
          className={`text-[#020912]/40 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      <div
        className={`
          absolute right-0 top-full mt-1 w-48 z-50
          bg-white border shadow-lg
          transition-all duration-150 origin-top-right
          ${
            isOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-1 pointer-events-none'
          }
        `}
        style={{ borderColor: 'rgba(2, 9, 18, 0.1)' }}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="py-1">
          {resolvedItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={close}
              role="menuitem"
              className="block w-full text-left px-4 py-2.5 text-sm text-[#020912] hover:bg-[#020912]/5 transition-colors duration-100"
            >
              {item.label}
            </Link>
          ))}

          {/* Separator */}
          <div
            className="my-1 border-t"
            style={{ borderColor: 'rgba(2, 9, 18, 0.1)' }}
            role="separator"
          />

          {/* Sign out */}
          <button
            onClick={() => {
              close();
              signOut();
            }}
            role="menuitem"
            className="block w-full text-left px-4 py-2.5 text-sm text-[#020912]/60 hover:bg-[#020912]/5 hover:text-[#020912] transition-colors duration-100"
          >
            {'\uB85C\uADF8\uC544\uC6C3'}
          </button>
        </div>
      </div>
    </div>
  );
}
