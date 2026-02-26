'use client';

import type { CardTheme } from '@/types/card';
import { THEME_LIST } from '@/components/admin/ThemeListBox';

interface ThemeStats {
  theme: string;
  count: number;
}

interface ThemeMobileSelectorProps {
  selectedTheme: CardTheme;
  onSelect: (theme: CardTheme) => void;
  stats: ThemeStats[];
  statsLoading: boolean;
}

export function ThemeMobileSelector({ selectedTheme, onSelect, stats, statsLoading }: ThemeMobileSelectorProps) {
  const getStatCount = (themeId: string): number => {
    const found = stats.find((s) => s.theme === themeId);
    return found ? found.count : 0;
  };

  return (
    <div>
      <label htmlFor="mobile-theme-selector" className="block text-sm font-medium text-[#020912] mb-1">
        {'\ud14c\ub9c8 \uc120\ud0dd'}
      </label>
      <select
        id="mobile-theme-selector"
        value={selectedTheme}
        onChange={(e) => onSelect(e.target.value as CardTheme)}
        className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
      >
        {THEME_LIST.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name} ({theme.nameEn}){statsLoading ? '' : ` - ${getStatCount(theme.id)}\uac74`}
          </option>
        ))}
      </select>
    </div>
  );
}
