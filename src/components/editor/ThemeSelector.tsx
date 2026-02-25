'use client';

import { useCardStore } from '@/stores/useCardStore';
import type { CardTheme } from '@/types/card';

const THEME_OPTIONS: { id: CardTheme; label: string; description: string }[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Minimal design',
  },
  {
    id: 'pokemon',
    label: 'Pokemon',
    description: 'Trading card style',
  },
];

export function ThemeSelector() {
  const theme = useCardStore((state) => state.card.theme ?? 'classic');
  const setTheme = useCardStore((state) => state.setTheme);

  const handleKeyDown = (e: React.KeyboardEvent, themeId: CardTheme) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setTheme(themeId);
    }
    // Arrow key navigation
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === themeId);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      setTheme(THEME_OPTIONS[nextIndex].id);
      // Focus the next option
      const nextEl = document.getElementById(`theme-option-${THEME_OPTIONS[nextIndex].id}`);
      nextEl?.focus();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === themeId);
      const prevIndex = (currentIndex - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
      setTheme(THEME_OPTIONS[prevIndex].id);
      const prevEl = document.getElementById(`theme-option-${THEME_OPTIONS[prevIndex].id}`);
      prevEl?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Theme
      </label>
      <div
        role="radiogroup"
        aria-label="Card theme selection"
        className="grid grid-cols-2 gap-3"
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              id={`theme-option-${option.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setTheme(option.id)}
              onKeyDown={(e) => handleKeyDown(e, option.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Icon area */}
              <div className="w-10 h-10 flex items-center justify-center">
                {option.id === 'classic' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className={`w-7 h-7 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className={`w-7 h-7 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {option.label}
              </span>

              {/* Description */}
              <span
                className={`text-xs ${
                  isSelected ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
