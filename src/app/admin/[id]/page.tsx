'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { RequestDetail } from '@/components/admin/RequestDetail';
import type { CardRequest } from '@/types/request';

interface RequestData {
  request: CardRequest;
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
}

export default function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (res.status === 404) {
        setError('의뢰를 찾을 수 없습니다.');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData({
        request: json,
        originalAvatarUrl: json.originalAvatarUrl,
        illustrationUrl: json.illustrationUrl,
      });
      setError(null);
    } catch {
      setError('의뢰 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; 목록으로
        </Link>
      </div>
      <RequestDetail
        request={data.request}
        originalAvatarUrl={data.originalAvatarUrl}
        illustrationUrl={data.illustrationUrl}
        onUpdate={fetchData}
      />
    </div>
  );
}
