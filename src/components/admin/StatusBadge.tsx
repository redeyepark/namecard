import type { RequestStatus } from '@/types/request';

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: '의뢰됨',
    className: 'bg-blue-100 text-blue-800',
  },
  processing: {
    label: '작업중',
    className: 'bg-amber-100 text-amber-800',
  },
  confirmed: {
    label: '확정',
    className: 'bg-green-100 text-green-800',
  },
  revision_requested: {
    label: '수정요청',
    className: 'bg-orange-100 text-orange-800',
  },
  rejected: {
    label: '반려',
    className: 'bg-red-100 text-red-800',
  },
  delivered: {
    label: '전달완료',
    className: 'bg-emerald-100 text-emerald-800',
  },
  cancelled: {
    label: '취소',
    className: 'bg-gray-100 text-gray-800',
  },
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
