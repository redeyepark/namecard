'use client';

import type { CoffeeChatStatus } from '@/types/coffee-chat';

interface CoffeeChatActionsProps {
  status: CoffeeChatStatus;
  isRequester: boolean;
  loading?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export default function CoffeeChatActions({
  status,
  isRequester,
  loading = false,
  onAccept,
  onDecline,
  onCancel,
  onComplete,
}: CoffeeChatActionsProps) {
  // No actions for terminal states
  if (status === 'declined' || status === 'cancelled' || status === 'completed') {
    return null;
  }

  // Pending: receiver can accept/decline, requester can cancel
  if (status === 'pending') {
    if (!isRequester) {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="bg-[#10b981] text-white hover:bg-[#059669] px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            수락
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={loading}
            className="bg-[#6b7280] text-white hover:bg-[#4b5563] px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            정중히 거절
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="border border-[#6b7280] text-[#6b7280] hover:bg-[#6b7280] hover:text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          취소
        </button>
      </div>
    );
  }

  // Accepted: either role can mark as complete
  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="bg-[#020912] text-[#fcfcfc] hover:opacity-90 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          만남 완료
        </button>
      </div>
    );
  }

  return null;
}
