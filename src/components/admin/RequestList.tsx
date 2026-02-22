'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import type { RequestSummary } from '@/types/request';

export function RequestList() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRequests(data.requests);
      } catch {
        setError('의뢰 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

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
      <div className="text-center py-12" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">아직 의뢰가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">사진</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">요청 ID</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이름</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">제출일</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">상태</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const date = new Date(req.submittedAt);
            const formatted = date.toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr
                key={req.id}
                onClick={() => router.push(`/admin/${req.id}`)}
                className="border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff] cursor-pointer transition-colors"
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/${req.id}`);
                  }
                }}
              >
                <td className="py-3 px-4">
                  <div className="w-10 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {req.originalAvatarUrl ? (
                      <img
                        src={req.originalAvatarUrl}
                        alt="Avatar thumbnail"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <p className="text-xs text-gray-300">없음</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">
                  {req.id.slice(0, 8)}...
                </td>
                <td className="py-3 px-4 text-[#020912] font-medium">
                  {req.displayName}
                </td>
                <td className="py-3 px-4 text-[#020912]/50">{formatted}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={req.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
