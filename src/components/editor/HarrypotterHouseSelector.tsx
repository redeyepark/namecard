'use client';

import { useCardStore } from '@/stores/useCardStore';
import { HARRYPOTTER_HOUSES } from '@/components/card/harrypotter-types';
import type { HarrypotterHouse } from '@/types/card';

export function HarrypotterHouseSelector() {
  const house = useCardStore(
    (state) => state.card.harrypotterMeta?.house ?? 'gryffindor'
  );
  const setHarrypotterHouse = useCardStore((state) => state.setHarrypotterHouse);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        House
      </label>
      <div
        role="radiogroup"
        aria-label="Harry Potter house selection"
        className="grid grid-cols-2 gap-2"
      >
        {HARRYPOTTER_HOUSES.map((houseConfig) => {
          const isSelected = house === houseConfig.id;
          return (
            <button
              key={houseConfig.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${houseConfig.name} - ${houseConfig.label}`}
              onClick={() => setHarrypotterHouse(houseConfig.id as HarrypotterHouse)}
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
                  backgroundColor: houseConfig.color,
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 0 0 4px ${houseConfig.color}`
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
                  {houseConfig.name}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isSelected ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {houseConfig.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
