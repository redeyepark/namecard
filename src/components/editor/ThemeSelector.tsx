'use client';

import { useCardStore } from '@/stores/useCardStore';
import { useCustomThemes } from '@/hooks/useCustomThemes';
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
  {
    id: 'hearthstone',
    label: 'Hearthstone',
    description: 'Legendary card style',
  },
  {
    id: 'harrypotter',
    label: 'Harry Potter',
    description: 'Wizard card style',
  },
  {
    id: 'tarot',
    label: 'Tarot',
    description: 'Mystical card style',
  },
  {
    id: 'nametag',
    label: 'Nametag',
    description: 'Corporate badge style',
  },
];

export function ThemeSelector() {
  const theme = useCardStore((state) => state.card.theme ?? 'classic');
  const setTheme = useCardStore((state) => state.setTheme);
  const { themes: customThemes, isLoading: customLoading } = useCustomThemes();

  // Only show active custom themes
  const activeCustomThemes = (customThemes ?? []).filter((t) => t.isActive);

  // Build combined list for arrow key navigation
  const allOptions: { id: CardTheme; label: string }[] = [
    ...THEME_OPTIONS,
    ...activeCustomThemes.map((ct) => ({ id: ct.slug as CardTheme, label: ct.name })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent, themeId: CardTheme) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setTheme(themeId);
    }
    // Arrow key navigation
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = allOptions.findIndex((t) => t.id === themeId);
      const nextIndex = (currentIndex + 1) % allOptions.length;
      setTheme(allOptions[nextIndex].id);
      const nextEl = document.getElementById(`theme-option-${allOptions[nextIndex].id}`);
      nextEl?.focus();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = allOptions.findIndex((t) => t.id === themeId);
      const prevIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
      setTheme(allOptions[prevIndex].id);
      const prevEl = document.getElementById(`theme-option-${allOptions[prevIndex].id}`);
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
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
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
                ) : option.id === 'pokemon' ? (
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
                ) : option.id === 'hearthstone' ? (
                  /* Hearthstone icon - shield/gem shape */
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
                      d="M12 2L3 7v6c0 5.25 3.75 10.13 9 11.25 5.25-1.12 9-6 9-11.25V7l-9-5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6l-2.5 5L12 16l2.5-5L12 6z"
                    />
                  </svg>
                ) : option.id === 'harrypotter' ? (
                  /* Harry Potter icon - magic wand with stars */
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
                      d="M15.5 2.5l-1 2.5-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 8l-.5 1.5L4 10l1.5.5L6 12l.5-1.5L8 10l-1.5-.5L6 8z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.5 20.5l13-13M5 22l-3-3"
                    />
                  </svg>
                ) : option.id === 'nametag' ? (
                  /* Nametag icon - ID badge */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className={`w-7 h-7 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    <rect x="4" y="2" width="16" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M10 14h4" />
                  </svg>
                ) : (
                  /* Tarot icon - mystical eye */
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
                      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
                    />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
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

      {/* Custom themes section */}
      {customLoading ? (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Custom</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-100 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="h-3 bg-gray-100 w-16" />
                <div className="h-2 bg-gray-50 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : activeCustomThemes.length > 0 ? (
        <div className="pt-2">
          {/* Divider label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Custom</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {activeCustomThemes.map((ct) => {
              const isSelected = theme === ct.slug;
              return (
                <button
                  key={ct.id}
                  id={`theme-option-${ct.slug}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setTheme(ct.slug as CardTheme)}
                  onKeyDown={(e) => handleKeyDown(e, ct.slug as CardTheme)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Colored circle icon */}
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div
                      className="w-7 h-7 rounded-full"
                      style={{ backgroundColor: ct.accentColor }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm font-medium truncate max-w-full ${
                      isSelected ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {ct.name}
                  </span>

                  {/* Description */}
                  <span
                    className={`text-xs ${
                      isSelected ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {ct.baseTemplate === 'classic' ? 'Classic base' : 'Nametag base'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
