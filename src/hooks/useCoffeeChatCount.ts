'use client';

import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL_MS = 60_000;

export function useCoffeeChatCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/coffee-chat/pending-count');
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // Silent fail – badge count is non-critical
    }
  }, []);

  // Initial fetch + polling every 60 seconds
  useEffect(() => {
    fetchCount();

    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Re-fetch when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCount]);

  // Manual refresh alias
  const refresh = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, refresh };
}
