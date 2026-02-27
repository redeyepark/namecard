'use client';

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
 * Simple overflow-x scroll, no fade indicators.
 */
export function ThemeDistribution({
  distribution,
  selectedTheme,
  onFilterChange,
}: ThemeDistributionProps) {
  if (!distribution || distribution.length === 0) {
    return null;
  }

  // Sort by count descending
  const sorted = [...distribution].sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((sum, item) => sum + item.count, 0);

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto px-1 py-1 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
  );
}
