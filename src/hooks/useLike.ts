'use client';

import { useState, useCallback } from 'react';

/**
 * Optimistic UI hook for toggling card likes.
 * Performs an immediate UI update, then syncs with the server.
 * Rolls back on error.
 */
export function useLike(cardId: string, initialLiked: boolean, initialCount: number) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(async () => {
    // Optimistic update
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/cards/${cardId}/like`, { method: 'POST' });
      if (!res.ok) {
        // Rollback on error
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch {
      // Rollback on network error
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, liked, count]);

  return { liked, count, isLoading, toggle };
}
