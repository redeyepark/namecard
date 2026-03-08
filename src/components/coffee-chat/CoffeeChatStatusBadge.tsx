'use client';

import type { CoffeeChatStatus } from '@/types/coffee-chat';
import { STATUS_LABELS } from '@/types/coffee-chat';

interface CoffeeChatStatusBadgeProps {
  status: CoffeeChatStatus;
}

const STATUS_STYLES: Record<CoffeeChatStatus, string> = {
  pending: 'bg-warning text-primary',
  accepted: 'bg-success text-secondary',
  declined: 'bg-text-secondary text-secondary',
  cancelled: 'bg-text-secondary text-secondary',
  completed: 'bg-primary text-secondary',
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
