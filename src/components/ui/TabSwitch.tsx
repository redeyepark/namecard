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
      className="flex gap-1 bg-accent-blue p-1 border border-border-medium"
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
              ? 'bg-primary text-secondary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
