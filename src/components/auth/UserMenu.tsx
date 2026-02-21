'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export function UserMenu() {
  const { user, isLoading, isAdmin, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="w-16 h-4 rounded bg-gray-200 animate-pulse hidden sm:block" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        <span className="hidden sm:inline">로그인</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? 'User avatar'}
          className="w-8 h-8 rounded-full ring-2 ring-red-100"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-red-700">
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        </div>
      )}

      {/* Name and role badge */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{user.name}</span>
        {isAdmin && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 rounded">
            관리자
          </span>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-all duration-200"
        aria-label="로그아웃"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
        <span className="hidden sm:inline">로그아웃</span>
      </button>
    </div>
  );
}
