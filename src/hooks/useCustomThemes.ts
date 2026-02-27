'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CustomTheme } from '@/types/custom-theme';

// Module-level cache for stale-while-revalidate behavior
let cachedThemes: CustomTheme[] | null = null;

/**
 * Hook that fetches custom themes from GET /api/themes.
 * Returns cached data immediately while revalidating in the background.
 */
export function useCustomThemes() {
  const [themes, setThemes] = useState<CustomTheme[] | null>(cachedThemes);
  const [isLoading, setIsLoading] = useState<boolean>(cachedThemes === null);
  const [error, setError] = useState<Error | null>(null);

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/themes');
      if (!res.ok) {
        throw new Error(`Failed to fetch themes: ${res.status}`);
      }
      const json = await res.json();
      // API returns { builtin, custom } - extract the custom themes array
      const data: CustomTheme[] = Array.isArray(json) ? json : (json.custom ?? json.themes ?? []);
      cachedThemes = data;
      setThemes(data);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setError(fetchError);
      // Graceful degradation: return empty array on error
      if (!cachedThemes) {
        setThemes([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return { themes, isLoading, error, refetch: fetchThemes };
}
