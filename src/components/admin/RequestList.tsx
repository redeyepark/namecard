'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { EventBadge } from './EventBadge';
import { EventFilter } from './EventFilter';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import type { RequestSummary } from '@/types/request';

export function RequestList() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, reqId: string, displayName: string) => {
    e.stopPropagation(); // Prevent row click navigation
    if (!window.confirm(`"${displayName}" 명함의뢰를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setDeletingId(reqId);
    try {
      const res = await fetch(`/api/requests/${reqId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

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

  // Filter requests by event
  const filteredRequests = useMemo(() => {
    if (eventFilter === '') return requests; // All
    if (eventFilter === 'none') return requests.filter((r) => !r.eventId);
    return requests.filter((r) => r.eventId === eventFilter);
  }, [requests, eventFilter]);

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
    <div>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <label className="text-xs font-medium text-[#020912]/60">이벤트:</label>
        <EventFilter value={eventFilter} onChange={setEventFilter} />
        {eventFilter !== '' && (
          <span className="text-xs text-gray-500">
            {filteredRequests.length}건
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">사진</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">요청 ID</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이름</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이벤트</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">제출일</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60">상태</th>
              <th className="text-left py-3 px-4 font-medium text-[#020912]/60"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
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
                    <div className="flex items-center gap-1.5">
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
                      {req.illustrationUrl && (
                        <div className="w-10 h-12 rounded border border-purple-200 bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={convertGoogleDriveUrl(req.illustrationUrl) || req.illustrationUrl}
                            alt="Illustration thumbnail"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">
                    {req.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-[#020912] font-medium">
                    {req.displayName}
                  </td>
                  <td className="py-3 px-4">
                    <EventBadge eventName={req.eventName || undefined} />
                  </td>
                  <td className="py-3 px-4 text-[#020912]/50">{formatted}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, req.id, req.displayName)}
                      disabled={deletingId === req.id}
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="삭제"
                    >
                      {deletingId === req.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && requests.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">선택한 이벤트에 해당하는 의뢰가 없습니다</p>
        </div>
      )}
    </div>
  );
}
