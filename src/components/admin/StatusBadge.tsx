import type { RequestStatus } from '@/types/request';

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: '의뢰됨',
    className: 'bg-accent-blue text-primary',
  },
  processing: {
    label: '작업중',
    className: 'bg-accent-orange/20 text-primary',
  },
  confirmed: {
    label: '확정',
    className: 'bg-accent-green text-primary',
  },
  revision_requested: {
    label: '수정요청',
    className: 'bg-accent-peach text-primary',
  },
  rejected: {
    label: '반려',
    className: 'bg-error/10 text-error',
  },
  delivered: {
    label: '전달완료',
    className: 'bg-primary text-secondary',
  },
  cancelled: {
    label: '취소',
    className: 'bg-divider text-primary',
  },
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
