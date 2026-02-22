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
      className="flex gap-1 bg-[#e4f6ff] p-1 border border-[rgba(2,9,18,0.15)]"
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
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
            activeSide === side
              ? 'bg-[#020912] text-[#fcfcfc]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
