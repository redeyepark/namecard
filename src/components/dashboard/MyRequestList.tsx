'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ProgressStepper } from './ProgressStepper';
import { RequestCard } from './RequestCard';
import type { RequestSummary } from '@/types/request';

interface MyRequestListProps {
  requests: RequestSummary[];
}

export function MyRequestList({ requests }: MyRequestListProps) {
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {requests.map((req) => (
          <RequestCard key={req.id} request={req} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">제출일</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">진행</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const date = new Date(req.submittedAt);
              const formatted = date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <tr key={req.id}>
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/${req.id}`}
                      className="font-medium text-gray-900 hover:text-red-600 transition-colors"
                    >
                      {req.displayName}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatted}</td>
                  <td className="py-3 px-4 w-48">
                    <ProgressStepper currentStatus={req.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
