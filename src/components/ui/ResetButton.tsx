'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';

export function ResetButton() {
  const resetCard = useCardStore((state) => state.resetCard);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = useCallback(() => {
    resetCard();
    setShowConfirm(false);
  }, [resetCard]);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary shrink-0">Reset all?</span>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 sm:py-2.5 bg-error text-white text-sm rounded-lg font-medium hover:bg-error/90 focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
          aria-label="Confirm reset to default"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="px-3 py-2 sm:py-2.5 bg-bg text-text-primary text-sm rounded-lg font-medium hover:bg-divider focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 transition-colors min-h-[44px]"
          aria-label="Cancel reset"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 sm:py-2.5 border border-divider text-text-primary text-sm rounded-lg font-medium hover:bg-bg hover:border-border-medium focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 transition-colors min-h-[44px] sm:w-auto w-full"
      aria-label="Reset card to default"
    >
      Reset
    </button>
  );
}
