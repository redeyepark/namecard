'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ProgressStepper } from './ProgressStepper';
import type { RequestSummary } from '@/types/request';

interface RequestCardProps {
  request: RequestSummary;
}

export function RequestCard({ request }: RequestCardProps) {
  const submittedDate = new Date(request.submittedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      href={`/dashboard/${request.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{request.displayName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{submittedDate}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <div className="pt-2 border-t border-gray-100">
        <ProgressStepper currentStatus={request.status} />
      </div>
    </Link>
  );
}
