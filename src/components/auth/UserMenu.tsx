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

      {/* Settings link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#020912] bg-[#e4f6ff] hover:bg-[#e4f6ff]/70 transition-all duration-200"
        aria-label="설정"
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
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="hidden sm:inline">설정</span>
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
