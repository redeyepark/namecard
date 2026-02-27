'use client';

import { useState, useCallback } from 'react';

/**
 * Optimistic UI hook for toggling card bookmarks.
 * Performs an immediate UI update, then syncs with the server.
 * Rolls back on error.
 */
export function useBookmark(cardId: string, initialBookmarked: boolean) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(async () => {
    const prev = bookmarked;
    setBookmarked(!bookmarked);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/cards/${cardId}/bookmark`, { method: 'POST' });
      if (!res.ok) {
        setBookmarked(prev);
        return;
      }
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(prev);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, bookmarked]);

  return { bookmarked, isLoading, toggle };
}
