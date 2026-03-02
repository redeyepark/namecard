'use client';

import type { CoffeeChatStatus } from '@/types/coffee-chat';
import { STATUS_LABELS } from '@/types/coffee-chat';

interface CoffeeChatStatusBadgeProps {
  status: CoffeeChatStatus;
}

const STATUS_STYLES: Record<CoffeeChatStatus, string> = {
  pending: 'bg-[#f59e0b] text-[#020912]',
  accepted: 'bg-[#10b981] text-[#fcfcfc]',
  declined: 'bg-[#6b7280] text-[#fcfcfc]',
  cancelled: 'bg-[#6b7280] text-[#fcfcfc]',
  completed: 'bg-[#020912] text-[#fcfcfc]',
};

export default function CoffeeChatStatusBadge({ status }: CoffeeChatStatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
