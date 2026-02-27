'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/auth/UserMenu';
import { MyRequestList } from '@/components/dashboard/MyRequestList';
import { EmptyState } from '@/components/dashboard/EmptyState';
import type { RequestSummary } from '@/types/request';

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch user's requests
  useEffect(() => {
    if (!user) return;

    async function fetchMyRequests() {
      try {
        const res = await fetch('/api/requests/my');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRequests(data.requests);
      } catch {
        setError('요청 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchMyRequests();
  }, [user]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* Navigation Header */}
      <header className="bg-white border-b border-[rgba(2,9,18,0.1)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-[#020912] hover:text-[#020912]/80 transition-colors"
            >
              Namecard
            </Link>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Greeting */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl font-bold text-[#020912]">
            {user.name ? `안녕하세요, ${user.name}님` : '안녕하세요'}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#020912]/50">
            명함 제작 요청 현황을 확인하세요.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {/* Primary action: Create new namecard */}
          <Link
            href="/create"
            className="group flex items-center gap-4 p-5 bg-[#020912] text-[#fcfcfc] border border-[#020912] hover:bg-[#020912]/90 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#fcfcfc]/10 rounded-lg group-hover:bg-[#fcfcfc]/20 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold">새 명함 만들기</span>
              <p className="text-xs text-[#fcfcfc]/60 mt-0.5">새로운 명함을 제작합니다</p>
            </div>
          </Link>

          {/* Secondary action: Settings */}
          <Link
            href="/dashboard/settings"
            className="group flex items-center gap-4 p-5 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#e4f6ff] rounded-lg group-hover:bg-[#e4f6ff]/70 transition-colors">
              <svg
                className="w-5 h-5 text-[#020912]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
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
            </div>
            <div>
              <span className="text-sm font-semibold">설정</span>
              <p className="text-xs text-[#020912]/50 mt-0.5">계정 및 환경설정</p>
            </div>
          </Link>

          {/* Admin action: Admin page (only shown if admin) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="group flex items-center gap-4 p-5 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#e4f6ff] rounded-lg group-hover:bg-[#e4f6ff]/70 transition-colors">
                <svg
                  className="w-5 h-5 text-[#020912]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold">관리자 페이지</span>
                <p className="text-xs text-[#020912]/50 mt-0.5">요청 관리 및 시스템 설정</p>
              </div>
            </Link>
          )}
        </div>

        {/* Request List Section */}
        <div>
          <h2 className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-[#020912] mb-4">
            내 요청 현황
          </h2>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="animate-spin h-6 w-6 mx-auto mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              로딩 중...
            </div>
          ) : error ? (
            <div className="text-center py-12" role="alert">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState />
          ) : (
            <MyRequestList requests={requests} />
          )}
        </div>
      </main>
    </div>
  );
}
