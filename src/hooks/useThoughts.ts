'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type { ThoughtWithAuthor } from '@/types/question';

interface UseThoughtsOptions {
  sort?: 'latest' | 'popular';
}

export function useThoughts(questionId: string, options: UseThoughtsOptions = {}) {
  const { sort = 'latest' } = options;
  const [thoughts, setThoughts] = useState<ThoughtWithAuthor[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const initialFetchDone = useRef(false);

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  const fetchThoughts = useCallback(
    async (cursor: string | null, reset: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '20');
        params.set('sort', sort);

        const res = await fetch(
          `/api/questions/${questionId}/thoughts?${params.toString()}`
        );
        if (!res.ok) throw new Error('Failed to fetch thoughts');

        const data = await res.json();

        if (reset) {
          setThoughts(data.thoughts);
        } else {
          setThoughts((prev) => [...prev, ...data.thoughts]);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError('답변 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [questionId, sort]
  );

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading && nextCursor) {
      fetchThoughts(nextCursor, false);
    }
  }, [inView, hasMore, loading, nextCursor, fetchThoughts]);

  // Re-fetch when sort changes
  useEffect(() => {
    initialFetchDone.current = true;
    setThoughts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchThoughts(null, true);
  }, [sort, fetchThoughts]);

  // Create thought and prepend to list
  const createThought = useCallback(
    async (content: string) => {
      setIsCreating(true);
      setError(null);
      try {
        const res = await fetch(`/api/questions/${questionId}/thoughts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '답변 작성에 실패했습니다.');
        }

        // Ensure data is properly typed as ThoughtWithAuthor
        setThoughts((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '답변 작성에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [questionId]
  );

  // Delete thought and remove from list
  const deleteThought = useCallback(
    async (thoughtId: string) => {
      const prevThoughts = thoughts;
      setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));

      try {
        const res = await fetch(
          `/api/questions/${questionId}/thoughts/${thoughtId}`,
          { method: 'DELETE' }
        );

        if (!res.ok) {
          setThoughts(prevThoughts);
          const data = await res.json();
          throw new Error(data.error || '답변 삭제에 실패했습니다.');
        }
      } catch (err) {
        setThoughts(prevThoughts);
        throw err;
      }
    },
    [questionId, thoughts]
  );

  // Update a specific thought's like state (called from ThoughtLikeButton)
  const updateThoughtLike = useCallback(
    (thoughtId: string, liked: boolean, likeCount: number) => {
      setThoughts((prev) =>
        prev.map((t) =>
          t.id === thoughtId ? { ...t, isLiked: liked, likeCount } : t
        )
      );
    },
    []
  );

  // Edit an existing thought
  const editThought = useCallback(
    async (thoughtId: string, content: string) => {
      const prevThoughts = thoughts;

      // Optimistic update
      setThoughts((prev) =>
        prev.map((t) =>
          t.id === thoughtId
            ? { ...t, content, updatedAt: new Date().toISOString() }
            : t
        )
      );

      try {
        const res = await fetch(
          `/api/questions/${questionId}/thoughts/${thoughtId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          // Rollback on error
          setThoughts(prevThoughts);
          throw new Error(data.error || '답변 수정에 실패했습니다.');
        }

        // Update with server response (to get correct updatedAt timestamp)
        setThoughts((prev) =>
          prev.map((t) => (t.id === thoughtId ? data : t))
        );
        return data;
      } catch (err) {
        // Rollback on error
        setThoughts(prevThoughts);
        throw err;
      }
    },
    [questionId, thoughts]
  );

  const retry = useCallback(() => {
    fetchThoughts(nextCursor, false);
  }, [fetchThoughts, nextCursor]);

  return {
    thoughts,
    loading,
    error,
    hasMore,
    isCreating,
    sentinelRef,
    createThought,
    deleteThought,
    editThought,
    updateThoughtLike,
    retry,
  };
}
