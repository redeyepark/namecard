'use client';

import { useState, useEffect, useCallback } from 'react';
import { RequestList } from '@/components/admin/RequestList';
import { BulkUploadModal } from '@/components/admin/BulkUploadModal';
import { ViewToggle } from '@/components/admin/ViewToggle';
import { AdminGalleryGrid } from '@/components/admin/AdminGalleryGrid';
import { AdminGalleryFilters } from '@/components/admin/AdminGalleryFilters';
import { EventFilter } from '@/components/admin/EventFilter';
import { useAdminFilters } from '@/hooks/useAdminFilters';
import type { RequestStatus, RequestSummary } from '@/types/request';

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byEvent: { eventId: string | null; eventName: string; count: number }[];
  byTheme: Record<string, number>;
  recentRequests: RequestSummary[];
}

const STATUS_LABELS: Record<string, string> = {
  submitted: '\uC758\uB8B0\uB428',
  processing: '\uC791\uC5C5\uC911',
  revision_requested: '\uC218\uC815\uC694\uCCAD',
  confirmed: '\uD655\uC815',
  rejected: '\uBC18\uB824',
  delivered: '\uC804\uB2EC\uC644\uB8CC',
  cancelled: '\uCDE8\uC18C',
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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('admin-view-mode') as 'table' | 'gallery') || 'table';
    }
    return 'table';
  });

  // Page-level request data (shared between table and gallery views)
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('admin-view-mode', viewMode);
  }, [viewMode]);

  const handleBulkUploadComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
      } catch {
        setError('\uB300\uC2DC\uBCF4\uB4DC \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Fetch requests at page level (shared data source)
  useEffect(() => {
    async function fetchRequests() {
      setReqLoading(true);
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRequests(data.requests || []);
      } catch {
        setReqError('\uC758\uB8B0 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
      } finally {
        setReqLoading(false);
      }
    }
    fetchRequests();
  }, [refreshKey]);

  // Filter hook for shared filtering across both views
  const {
    filters,
    filteredRequests,
    isAnyFilterActive,
    activeFilterCount,
    setSearchQuery,
    setEventFilter,
    toggleTheme,
    toggleStatus,
    setColorGroup,
    toggleHashtag,
    setImageFilter,
    resetAllFilters,
    uniqueHashtags,
    colorGroups,
  } = useAdminFilters(requests);

  // Handle delete from table view (remove from shared data)
  const handleDeleteSuccess = useCallback((deletedId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== deletedId));
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
        {'\uB85C\uB529 \uC911...'}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20" role="alert">
        <p className="text-red-600 text-sm">{error || '\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#020912]">{'\uB300\uC2DC\uBCF4\uB4DC'}</h1>
        <p className="mt-1 text-sm text-[#020912]/50">
          {'\uBA85\uD568 \uC758\uB8B0 \uD604\uD669\uC744 \uD55C\uB208\uC5D0 \uD655\uC778\uD569\uB2C8\uB2E4.'}
        </p>
      </div>

      {/* Section A: Status Summary Cards */}
      <div className="mb-8">
        {/* Total Count */}
        <div className="mb-4 bg-[#020912] text-[#fcfcfc] px-5 py-4 border border-[#020912]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#fcfcfc]/70">{'\uC804\uCCB4 \uC758\uB8B0'}</span>
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
          <h2 className="text-sm font-semibold text-[#020912] mb-3">{'\uC774\uBCA4\uD2B8\uBCC4 \uD604\uD669'}</h2>
          <div className="bg-white border border-[rgba(2,9,18,0.15)]">
            {stats.byEvent.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                {'\uB370\uC774\uD130 \uC5C6\uC74C'}
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
                          {item.count}{'\uAC74'}
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
          <h2 className="text-sm font-semibold text-[#020912] mb-3">{'\uD14C\uB9C8\uBCC4 \uD604\uD669'}</h2>
          <div className="bg-white border border-[rgba(2,9,18,0.15)]">
            {Object.keys(stats.byTheme).length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                {'\uB370\uC774\uD130 \uC5C6\uC74C'}
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
                            {count}{'\uAC74'}
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

      {/* Section E: Full Request List / Gallery with shared filters */}
      <div className="mt-8">
        {/* Header row: title, view toggle, filter button, bulk upload */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#020912]">{'\uC804\uCCB4 \uC758\uB8B0 \uBAA9\uB85D'}</h2>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="min-h-[44px] px-4 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] text-sm font-medium hover:bg-[#e4f6ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            CSV / Excel {'\uB300\uB7C9 \uB4F1\uB85D'}
          </button>
        </div>

        {/* Shared search + event filter bar */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="relative">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'\uC774\uB984 \uB610\uB294 ID \uAC80\uC0C9...'}
              className="text-sm border border-[rgba(2,9,18,0.15)] rounded-none bg-white px-3 py-1.5 pr-8 text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 w-52"
              aria-label={'\uC774\uB984 \uB610\uB294 ID\uB85C \uAC80\uC0C9'}
            />
            {filters.searchQuery !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#020912]/30 hover:text-[#020912]/60 transition-colors"
                aria-label={'\uAC80\uC0C9\uC5B4 \uC9C0\uC6B0\uAE30'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <label className="text-xs font-medium text-[#020912]/60">{'\uC774\uBCA4\uD2B8'}:</label>
          <EventFilter value={filters.eventFilter} onChange={setEventFilter} />
        </div>

        {/* Advanced filter panel */}
        <AdminGalleryFilters
          filters={filters}
          onToggleTheme={toggleTheme}
          onToggleStatus={toggleStatus}
          onSetColorGroup={setColorGroup}
          onToggleHashtag={toggleHashtag}
          onSetImageFilter={setImageFilter}
          onResetAll={resetAllFilters}
          isAnyFilterActive={isAnyFilterActive}
          activeFilterCount={activeFilterCount}
          uniqueHashtags={uniqueHashtags}
          colorGroups={colorGroups}
          totalCount={requests.length}
          filteredCount={filteredRequests.length}
          isOpen={showFilters}
          onToggleOpen={() => setShowFilters((v) => !v)}
        />

        {/* Content: loading / error / table / gallery */}
        {reqLoading ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="animate-spin h-5 w-5 mx-auto mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{'\uB85C\uB529 \uC911...'}</span>
          </div>
        ) : reqError ? (
          <div className="text-center py-12" role="alert">
            <p className="text-red-600 text-sm">{reqError}</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white border border-[rgba(2,9,18,0.15)]">
            <RequestList
              externalData={filteredRequests}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        ) : (
          <AdminGalleryGrid requests={filteredRequests} />
        )}
      </div>

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={handleBulkUploadComplete}
      />
    </div>
  );
}
