'use client';

import { RequestList } from '@/components/admin/RequestList';

export default function AdminPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">의뢰 목록</h1>
        <p className="mt-1 text-sm text-gray-500">
          사용자가 제출한 명함 의뢰를 관리합니다.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <RequestList />
      </div>
    </div>
  );
}
