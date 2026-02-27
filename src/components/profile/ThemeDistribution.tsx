'use client';

import { useRef, useEffect, useState } from 'react';

interface ThemeDistributionProps {
  distribution: { theme: string; count: number }[];
  selectedTheme: string | null;
  onFilterChange: (theme: string | null) => void;
}

/**
 * Theme label mapping for display.
 */
const themeLabelMap: Record<string, string> = {
  classic: 'Classic',
  pokemon: 'Pokemon',
  hearthstone: 'Hearthstone',
  harrypotter: 'Harry Potter',
  tarot: 'Tarot',
  nametag: 'Nametag',
  snsprofile: 'SNS Profile',
};

/**
 * Horizontal scrollable theme filter chips.
 * Shows "All" chip as default, followed by each theme with count.
 * Active chip gets dark background styling via .theme-chip.active CSS class.
 */
export function ThemeDistribution({
  distribution,
  selectedTheme,
  onFilterChange,
}: ThemeDistributionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll overflow for fade indicators
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setShowLeftFade(el.scrollLeft > 4);
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);

    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [distribution]);

  if (!distribution || distribution.length === 0) {
    return null;
  }

  // Sort by count descending
  const sorted = [...distribution].sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative w-full">
      {/* Left fade indicator */}
      {showLeftFade && (
        <div
          className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--color-surface), transparent)',
          }}
        />
      )}

      {/* Right fade indicator */}
      {showRightFade && (
        <div
          className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, var(--color-surface), transparent)',
          }}
        />
      )}

      {/* Scrollable chip container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto px-1 py-1 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* "All" chip */}
        <button
          type="button"
          className={`theme-chip ${selectedTheme === null ? 'active' : ''}`}
          onClick={() => onFilterChange(null)}
          aria-pressed={selectedTheme === null}
        >
          전체
          <span className="chip-count">{totalCount}</span>
        </button>

        {/* Theme chips */}
        {sorted.map((item) => {
          const label = themeLabelMap[item.theme] ?? item.theme;
          const isActive = selectedTheme === item.theme;

          return (
            <button
              type="button"
              key={item.theme}
              className={`theme-chip ${isActive ? 'active' : ''}`}
              onClick={() => onFilterChange(item.theme)}
              aria-pressed={isActive}
            >
              {label}
              <span className="chip-count">{item.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
