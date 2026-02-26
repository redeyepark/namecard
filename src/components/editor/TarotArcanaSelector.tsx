'use client';

import { useCardStore } from '@/stores/useCardStore';
import { TAROT_ARCANAS } from '@/components/card/tarot-types';
import type { TarotArcana } from '@/types/card';

export function TarotArcanaSelector() {
  const arcana = useCardStore(
    (state) => state.card.tarotMeta?.arcana ?? 'major'
  );
  const setTarotArcana = useCardStore((state) => state.setTarotArcana);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Arcana
      </label>
      <div
        role="radiogroup"
        aria-label="Tarot arcana selection"
        className="grid grid-cols-2 gap-2"
      >
        {TAROT_ARCANAS.map((arcanaConfig) => {
          const isSelected = arcana === arcanaConfig.id;
          return (
            <button
              key={arcanaConfig.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${arcanaConfig.name} - ${arcanaConfig.label}`}
              onClick={() => setTarotArcana(arcanaConfig.id as TarotArcana)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all min-h-[44px] ${
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Colored dot */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: arcanaConfig.color,
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 0 0 4px ${arcanaConfig.color}`
                    : undefined,
                }}
              />
              {/* Labels */}
              <div className="flex flex-col items-start min-w-0">
                <span
                  className={`text-xs font-medium leading-tight ${
                    isSelected ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {arcanaConfig.name}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isSelected ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {arcanaConfig.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
