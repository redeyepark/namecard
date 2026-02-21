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
