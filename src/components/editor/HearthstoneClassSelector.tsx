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
      <label className="block text-sm font-medium text-text-primary">
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
                  ? 'border-primary bg-bg shadow-sm'
                  : 'border-border-light bg-surface hover:border-border-medium'
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
                    isSelected ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {classConfig.name}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isSelected ? 'text-text-secondary' : 'text-text-tertiary'
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
