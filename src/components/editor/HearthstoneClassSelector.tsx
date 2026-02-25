'use client';

import { useCardStore } from '@/stores/useCardStore';
import { HEARTHSTONE_CLASSES } from '@/components/card/hearthstone-types';
import type { HearthstoneClass } from '@/types/card';

export function HearthstoneClassSelector() {
  const classType = useCardStore(
    (state) => state.card.hearthstoneMeta?.classType ?? 'warrior'
  );
  const setHearthstoneClass = useCardStore((state) => state.setHearthstoneClass);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Class
      </label>
      <div
        role="radiogroup"
        aria-label="Hearthstone class selection"
        className="grid grid-cols-3 gap-2"
      >
        {HEARTHSTONE_CLASSES.map((classConfig) => {
          const isSelected = classType === classConfig.id;
          return (
            <button
              key={classConfig.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${classConfig.name} - ${classConfig.label}`}
              onClick={() => setHearthstoneClass(classConfig.id as HearthstoneClass)}
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
                  backgroundColor: classConfig.color,
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 0 0 4px ${classConfig.color}`
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
                  {classConfig.name}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isSelected ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {classConfig.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
