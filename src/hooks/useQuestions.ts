'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type { QuestionWithAuthor } from '@/types/question';

interface UseQuestionsOptions {
  sort?: 'latest' | 'popular';
  tag?: string | null;
}

export function useQuestions(options: UseQuestionsOptions = {}) {
  const { sort = 'latest', tag = null } = options;
  const [questions, setQuestions] = useState<QuestionWithAuthor[]>([]);
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

  const fetchQuestions = useCallback(
    async (cursor: string | null, reset: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '20');
        params.set('sort', sort);
        if (tag) params.set('tag', tag);

        const res = await fetch(`/api/questions?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch questions');

        const data = await res.json();

        if (reset) {
          setQuestions(data.questions);
        } else {
          setQuestions((prev) => [...prev, ...data.questions]);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError('질문 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [sort, tag]
  );

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading && nextCursor) {
      fetchQuestions(nextCursor, false);
    }
  }, [inView, hasMore, loading, nextCursor, fetchQuestions]);

  // Re-fetch when sort or tag changes
  useEffect(() => {
    initialFetchDone.current = true;
    setQuestions([]);
    setNextCursor(null);
    setHasMore(true);
    fetchQuestions(null, true);
  }, [sort, tag, fetchQuestions]);

  // Create question and prepend to list
  const createQuestion = useCallback(
    async (content: string, hashtags: string[]) => {
      setIsCreating(true);
      try {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, hashtags }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '질문 작성에 실패했습니다.');
        }

        const newQuestion = await res.json();
        setQuestions((prev) => [newQuestion, ...prev]);
        return newQuestion;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  // Delete question and remove from list
  const deleteQuestion = useCallback(async (questionId: string) => {
    const prevQuestions = questions;
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setQuestions(prevQuestions);
        const data = await res.json();
        throw new Error(data.error || '질문 삭제에 실패했습니다.');
      }
    } catch (err) {
      setQuestions(prevQuestions);
      throw err;
    }
  }, [questions]);

  const retry = useCallback(() => {
    fetchQuestions(nextCursor, false);
  }, [fetchQuestions, nextCursor]);

  return {
    questions,
    loading,
    error,
    hasMore,
    isCreating,
    sentinelRef,
    createQuestion,
    deleteQuestion,
    retry,
  };
}
