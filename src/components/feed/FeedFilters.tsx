'use client';

import { useRef, useEffect, useCallback } from 'react';

interface FeedFiltersProps {
  currentTheme: string;
  currentSort: 'newest' | 'popular';
  onThemeChange: (theme: string) => void;
  onSortChange: (sort: 'newest' | 'popular') => void;
}

const THEME_TABS = [
  { value: 'all', label: 'All' },
  { value: 'classic', label: 'Classic' },
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'hearthstone', label: 'Hearthstone' },
  { value: 'harrypotter', label: 'Harry Potter' },
  { value: 'tarot', label: 'Tarot' },
  { value: 'nametag', label: 'Nametag' },
  { value: 'snsprofile', label: 'SNS Profile' },
] as const;

/**
 * Theme filter tabs and sort toggle for the community feed.
 * Horizontally scrollable on mobile with active state highlighting.
 */
export function FeedFilters({
  currentTheme,
  currentSort,
  onThemeChange,
  onSortChange,
}: FeedFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on mount or theme change
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentTheme]);

  const handleThemeClick = useCallback(
    (value: string) => {
      onThemeChange(value);
    },
    [onThemeChange],
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      {/* Theme tabs - horizontally scrollable */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1"
        role="tablist"
        aria-label="Theme filter"
      >
        {THEME_TABS.map((tab) => {
          const isActive = currentTheme === tab.value;
          return (
            <button
              key={tab.value}
              ref={isActive ? activeTabRef : undefined}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleThemeClick(tab.value)}
              className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#020912] text-[#fcfcfc]'
                  : 'bg-transparent text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSortChange('newest')}
          className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            currentSort === 'newest'
              ? 'bg-[#020912] text-[#fcfcfc]'
              : 'bg-transparent text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)]'
          }`}
          aria-pressed={currentSort === 'newest'}
        >
          최신순
        </button>
        <button
          onClick={() => onSortChange('popular')}
          className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            currentSort === 'popular'
              ? 'bg-[#020912] text-[#fcfcfc]'
              : 'bg-transparent text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)]'
          }`}
          aria-pressed={currentSort === 'popular'}
        >
          인기순
        </button>
      </div>
    </div>
  );
}
