'use client';

import type { CardTheme } from '@/types/card';

interface ThemeStats {
  theme: string;
  count: number;
}

export interface ThemeListBoxProps {
  selectedTheme: CardTheme;
  onSelect: (theme: CardTheme) => void;
  stats: ThemeStats[];
  statsLoading: boolean;
}

export interface ThemeListItem {
  id: CardTheme;
  name: string;
  nameEn: string;
  color: string;
  description: string;
}

export const THEME_LIST: ThemeListItem[] = [
  { id: 'classic', name: '\ud074\ub798\uc2dd', nameEn: 'Classic', color: '#020912', description: '\uae30\ubcf8 \ud074\ub798\uc2dd \uba85\ud568 \ub514\uc790\uc778' },
  { id: 'pokemon', name: '\ud3ec\ucf13\ubaac', nameEn: 'Pokemon', color: '#EED171', description: '\ud3ec\ucf13\ubaac \ud2b8\ub808\uc774\ub529 \uce74\ub4dc \uc2a4\ud0c0\uc77c' },
  { id: 'hearthstone', name: '\ud558\uc2a4\uc2a4\ud1a4', nameEn: 'Hearthstone', color: '#8B6914', description: '\ud558\uc2a4\uc2a4\ud1a4 \uce74\ub4dc \uc2a4\ud0c0\uc77c' },
  { id: 'harrypotter', name: '\ud574\ub9ac\ud3ec\ud130', nameEn: 'Harry Potter', color: '#740001', description: '\ud574\ub9ac\ud3ec\ud130 \ub9c8\ubc95\uc0ac \uce74\ub4dc \uc2a4\ud0c0\uc77c' },
  { id: 'tarot', name: '\ud0c0\ub85c', nameEn: 'Tarot', color: '#4A0E4E', description: '\ud0c0\ub85c \uce74\ub4dc \uc2a4\ud0c0\uc77c' },
  { id: 'nametag', name: '\ub124\uc784\ud0dc\uadf8', nameEn: 'Nametag', color: '#374151', description: '\uae30\uc5c5 \uba85\ud0dc\uadf8 \uc2a4\ud0c0\uc77c' },
];

export function ThemeListBox({ selectedTheme, onSelect, stats, statsLoading }: ThemeListBoxProps) {
  const getStatCount = (themeId: string): number => {
    const found = stats.find((s) => s.theme === themeId);
    return found ? found.count : 0;
  };

  return (
    <div role="listbox" aria-label="Theme selection" className="border border-[rgba(2,9,18,0.15)] bg-white">
      {THEME_LIST.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        const count = getStatCount(theme.id);

        return (
          <button
            key={theme.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(theme.id)}
            className={`w-full flex items-center gap-3 px-4 min-h-[56px] text-left transition-colors border-b border-[rgba(2,9,18,0.08)] last:border-b-0 ${
              isSelected
                ? 'bg-[#020912] text-white'
                : 'bg-white text-[#020912] hover:bg-gray-50'
            }`}
          >
            {/* Color indicator */}
            <div
              className="w-2 h-8 flex-shrink-0"
              style={{ backgroundColor: theme.color }}
              aria-hidden="true"
            />

            {/* Theme name */}
            <span className="flex-1 text-sm font-medium">{theme.name}</span>

            {/* Request count badge */}
            {statsLoading ? (
              <span
                className={`inline-block w-10 h-5 animate-pulse ${
                  isSelected ? 'bg-white/20' : 'bg-gray-200'
                }`}
                aria-label="Loading count"
              />
            ) : (
              <span
                className={`text-xs font-medium px-2 py-0.5 ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}\uac74
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
