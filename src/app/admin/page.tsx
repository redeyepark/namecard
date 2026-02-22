'use client';

import { useState, useCallback } from 'react';
import { RequestList } from '@/components/admin/RequestList';
import { BulkUploadModal } from '@/components/admin/BulkUploadModal';

export default function AdminPage() {
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBulkUploadComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">의뢰 목록</h1>
          <p className="mt-1 text-sm text-gray-500">
            사용자가 제출한 명함 의뢰를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowBulkUpload(true)}
          className="min-h-[44px] px-4 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          CSV 대량 등록
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <RequestList key={refreshKey} />
      </div>

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={handleBulkUploadComplete}
      />
    </div>
  );
}
