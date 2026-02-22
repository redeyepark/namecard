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
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-all duration-200"
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
          className="w-8 h-8 ring-2 ring-[#e4f6ff]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 bg-[#e4f6ff] flex items-center justify-center">
          <span className="text-sm font-semibold text-[#020912]">
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </span>
        </div>
      )}

      {/* Name and role badge */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm font-medium text-[#020912]">{user.name}</span>
        {isAdmin && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fcfcfc] bg-[#020912]">
            관리자
          </span>
        )}
      </div>

      {/* My requests link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#020912] bg-[#e4f6ff] hover:bg-[#e4f6ff]/70 transition-all duration-200"
        aria-label="내 요청"
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
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        <span className="hidden sm:inline">내 요청</span>
      </Link>

      {/* Logout button */}
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#020912]/60 bg-[#020912]/5 hover:bg-[#020912]/10 hover:text-[#020912] transition-all duration-200"
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
