'use client';

import type { CoffeeChatStatus } from '@/types/coffee-chat';
import { Button } from '@/components/ui';

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
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAccept}
            disabled={loading}
            className="bg-success hover:bg-success/90"
          >
            수락
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDecline}
            disabled={loading}
            className="bg-text-secondary text-white border-text-secondary hover:bg-text-secondary/80"
          >
            정중히 거절
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="border-text-secondary text-text-secondary hover:bg-text-secondary hover:text-white"
        >
          취소
        </Button>
      </div>
    );
  }

  // Accepted: either role can mark as complete
  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onComplete}
          disabled={loading}
        >
          만남 완료
        </Button>
      </div>
    );
  }

  return null;
}
