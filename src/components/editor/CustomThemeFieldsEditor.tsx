'use client';

import { useCustomThemes } from '@/hooks/useCustomThemes';
import { useCardStore } from '@/stores/useCardStore';

interface CustomThemeFieldsEditorProps {
  themeSlug: string;
}

/**
 * Renders input fields for a custom theme's custom fields.
 * Reads/writes from useCardStore.card.customThemeMeta via setCustomThemeMeta action.
 */
export function CustomThemeFieldsEditor({ themeSlug }: CustomThemeFieldsEditorProps) {
  const { themes, isLoading } = useCustomThemes();
  const customThemeMeta = useCardStore((state) => state.card.customThemeMeta ?? {});
  const setCustomThemeMeta = useCardStore((state) => state.setCustomThemeMeta);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-gray-200 w-20 mb-1" />
            <div className="h-9 bg-gray-100 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Find the theme definition
  const themeDef = (themes ?? []).find((t) => t.slug === themeSlug);

  if (!themeDef || !themeDef.customFields || themeDef.customFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Custom Fields
      </p>
      {themeDef.customFields.map((field) => {
        const currentValue = customThemeMeta[field.key] ?? '';

        return (
          <div key={field.key}>
            <label
              htmlFor={`ctf-${field.key}`}
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              {field.label}
            </label>
            {field.type === 'text' ? (
              <input
                id={`ctf-${field.key}`}
                type="text"
                value={String(currentValue)}
                onChange={(e) => setCustomThemeMeta(field.key, e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              />
            ) : (
              <input
                id={`ctf-${field.key}`}
                type="number"
                value={currentValue === '' ? '' : Number(currentValue)}
                min={field.min}
                max={field.max}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (field.min !== undefined) val = Math.max(field.min, val);
                  if (field.max !== undefined) val = Math.min(field.max, val);
                  setCustomThemeMeta(field.key, val);
                }}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
