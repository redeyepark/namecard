'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

const POLL_INTERVAL_MS = 60_000;

interface CoffeeChatCountContextType {
  count: number;
  refresh: () => void;
}

const CoffeeChatCountContext = createContext<CoffeeChatCountContextType>({
  count: 0,
  refresh: () => {},
});

export function useCoffeeChatCountContext() {
  return useContext(CoffeeChatCountContext);
}

export default function CoffeeChatCountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/coffee-chat/pending-count');
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // Silent fail - badge count is non-critical
    }
  }, [user]);

  // Initial fetch + polling every 60 seconds
  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchCount]);

  // Re-fetch when page becomes visible again
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchCount]);

  const refresh = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return (
    <CoffeeChatCountContext.Provider value={{ count, refresh }}>
      {children}
    </CoffeeChatCountContext.Provider>
  );
}
