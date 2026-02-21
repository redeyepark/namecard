'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-16 h-8 rounded-lg bg-gray-200 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-200"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/90 hidden sm:inline">
        {session.user.name}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white/80 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-200"
        aria-label="로그아웃"
      >
        로그아웃
      </button>
    </div>
  );
}
