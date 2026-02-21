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
        <span className="text-sm text-gray-600 shrink-0">Reset all?</span>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 sm:py-2.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
          aria-label="Confirm reset to default"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="px-3 py-2 sm:py-2.5 bg-gray-200 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
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
      className="px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-colors min-h-[44px] sm:w-auto w-full"
      aria-label="Reset card to default"
    >
      Reset
    </button>
  );
}
