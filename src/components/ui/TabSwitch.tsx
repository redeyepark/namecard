'use client';

import { useCardStore } from '@/stores/useCardStore';
import type { CardSide } from '@/types/card';

export function TabSwitch() {
  const activeSide = useCardStore((state) => state.activeSide);
  const setActiveSide = useCardStore((state) => state.setActiveSide);

  const tabs: { side: CardSide; label: string }[] = [
    { side: 'front', label: '\uC55E\uBA74' },
    { side: 'back', label: '\uB4B7\uBA74' },
  ];

  return (
    <div
      className="flex gap-1 bg-gray-200 p-1 rounded-lg"
      role="tablist"
      aria-label="Card side selection"
    >
      {tabs.map(({ side, label }) => (
        <button
          key={side}
          role="tab"
          aria-selected={activeSide === side}
          aria-controls={`panel-${side}`}
          id={`tab-${side}`}
          onClick={() => setActiveSide(side)}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px] ${
            activeSide === side
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
