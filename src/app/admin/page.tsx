'use client';

import { useState, useEffect, useCallback } from 'react';
import { RequestList } from '@/components/admin/RequestList';
import { BulkUploadModal } from '@/components/admin/BulkUploadModal';
import type { RequestStatus, RequestSummary } from '@/types/request';

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byEvent: { eventId: string | null; eventName: string; count: number }[];
  byTheme: Record<string, number>;
  recentRequests: RequestSummary[];
}

const STATUS_LABELS: Record<string, string> = {
  submitted: '의뢰됨',
  processing: '작업중',
  revision_requested: '수정요청',
  confirmed: '확정',
  rejected: '반려',
  delivered: '전달완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-[#e4f6ff] border-[#e4f6ff]',
  processing: 'bg-[#ffa639]/20 border-[#ffa639]/30',
  revision_requested: 'bg-[#ffdfc8] border-[#ffdfc8]',
  confirmed: 'bg-[#dbe9e0] border-[#dbe9e0]',
  rejected: 'bg-red-50 border-red-100',
  delivered: 'bg-[#020912]/5 border-[#020912]/10',
  cancelled: 'bg-gray-50 border-gray-100',
};

const THEME_LABELS: Record<string, string> = {
  classic: 'Classic',
  pokemon: 'Pokemon',
  hearthstone: 'Hearthstone',
  harrypotter: 'Harry Potter',
  tarot: 'Tarot',
};

// Active statuses to show prominently
const ACTIVE_STATUSES: RequestStatus[] = ['submitted', 'processing', 'revision_requested', 'confirmed'];
// Completed statuses shown smaller
const COMPLETED_STATUSES: RequestStatus[] = ['delivered', 'rejected', 'cancelled'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBulkUploadComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
      } catch {
        setError('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
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

  if (error || !stats) {
    return (
      <div className="text-center py-20" role="alert">
        <p className="text-red-600 text-sm">{error || '데이터를 불러올 수 없습니다.'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#020912]">대시보드</h1>
        <p className="mt-1 text-sm text-[#020912]/50">
          명함 의뢰 현황을 한눈에 확인합니다.
        </p>
      </div>

      {/* Section A: Status Summary Cards */}
      <div className="mb-8">
        {/* Total Count */}
        <div className="mb-4 bg-[#020912] text-[#fcfcfc] px-5 py-4 border border-[#020912]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#fcfcfc]/70">전체 의뢰</span>
            <span className="text-3xl font-bold">{stats.total}</span>
          </div>
        </div>

        {/* Active Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {ACTIVE_STATUSES.map((status) => (
            <div
              key={status}
              className={`px-4 py-3 border ${STATUS_COLORS[status]}`}
            >
              <div className="text-xs font-medium text-[#020912]/60 mb-1">
                {STATUS_LABELS[status]}
              </div>
              <div className="text-2xl font-bold text-[#020912]">
                {stats.byStatus[status] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Completed Status Cards - smaller */}
        <div className="grid grid-cols-3 gap-2">
          {COMPLETED_STATUSES.map((status) => (
            <div
              key={status}
              className={`px-3 py-2 border ${STATUS_COLORS[status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#020912]/50">
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-sm font-semibold text-[#020912]/70">
                  {stats.byStatus[status] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section C & D: Event and Theme Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Section C: Event Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-[#020912] mb-3">이벤트별 현황</h2>
          <div className="bg-white border border-[rgba(2,9,18,0.15)]">
            {stats.byEvent.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                데이터 없음
              </div>
            ) : (
              <div className="divide-y divide-[rgba(2,9,18,0.08)]">
                {stats.byEvent.map((item) => {
                  const barWidth = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                  return (
                    <div key={item.eventId ?? 'none'} className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#020912] truncate max-w-[70%]">
                          {item.eventName}
                        </span>
                        <span className="text-xs font-semibold text-[#020912]/70">
                          {item.count}건
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#e4f6ff] rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section D: Theme Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-[#020912] mb-3">테마별 현황</h2>
          <div className="bg-white border border-[rgba(2,9,18,0.15)]">
            {Object.keys(stats.byTheme).length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                데이터 없음
              </div>
            ) : (
              <div className="divide-y divide-[rgba(2,9,18,0.08)]">
                {Object.entries(stats.byTheme)
                  .sort(([, a], [, b]) => b - a)
                  .map(([theme, count]) => {
                    const barWidth = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={theme} className="px-4 py-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#020912]">
                            {THEME_LABELS[theme] || theme}
                          </span>
                          <span className="text-xs font-semibold text-[#020912]/70">
                            {count}건
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#ffa639]/30 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section E: Full Request List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#020912]">전체 의뢰 목록</h2>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="min-h-[44px] px-4 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] text-sm font-medium hover:bg-[#e4f6ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            CSV / Excel 대량 등록
          </button>
        </div>
        <div className="bg-white border border-[rgba(2,9,18,0.15)]">
          <RequestList key={refreshKey} />
        </div>
      </div>

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={handleBulkUploadComplete}
      />
    </div>
  );
}
