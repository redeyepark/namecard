'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { MyRequestDetail } from '@/components/dashboard/MyRequestDetail';
import type { CardRequest } from '@/types/request';

type DetailResponse = CardRequest & {
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
};

export default function DashboardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [request, setRequest] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard');
    }
  }, [authLoading, user, router]);

  // Fetch request detail
  useEffect(() => {
    if (!user || !params.id) return;

    async function fetchDetail() {
      try {
        const res = await fetch(`/api/requests/${params.id}`);

        if (res.status === 403) {
          router.replace('/dashboard');
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        setRequest(data);
      } catch {
        setError('요청 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [user, params.id, router]);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12" role="alert">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <MyRequestDetail request={request} />
    </div>
  );
}
