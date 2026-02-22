import type { RequestStatus } from '@/types/request';

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: '의뢰됨',
    className: 'bg-[#e4f6ff] text-[#020912]',
  },
  processing: {
    label: '작업중',
    className: 'bg-[#ffa639]/20 text-[#020912]',
  },
  confirmed: {
    label: '확정',
    className: 'bg-[#dbe9e0] text-[#020912]',
  },
  revision_requested: {
    label: '수정요청',
    className: 'bg-[#ffdfc8] text-[#020912]',
  },
  rejected: {
    label: '반려',
    className: 'bg-red-100 text-red-800',
  },
  delivered: {
    label: '전달완료',
    className: 'bg-[#020912] text-[#fcfcfc]',
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
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
