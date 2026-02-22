'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { MyRequestList } from '@/components/dashboard/MyRequestList';
import { EmptyState } from '@/components/dashboard/EmptyState';
import type { RequestSummary } from '@/types/request';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
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

  // Show nothing while checking auth
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020912]">내 요청</h1>
          <p className="mt-1 text-sm text-[#020912]/50">
            명함 제작 요청 현황을 확인하세요.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 명함 만들기
        </Link>
      </div>

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
  );
}
