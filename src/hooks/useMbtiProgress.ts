'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MbtiProgress } from '@/types/mbti';

export function useMbtiProgress() {
  const [progress, setProgress] = useState<MbtiProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mbti/questions');
      if (!res.ok) throw new Error('Failed to fetch MBTI progress');

      const data: MbtiProgress = await res.json();
      setProgress(data);
    } catch {
      setError('MBTI 진단 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const submitAnswer = useCallback(
    async (questionId: string, answer: 'A' | 'B') => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Optimistic update
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q, idx) => {
            if (q.id === questionId) {
              return { ...q, userAnswer: answer };
            }
            // Unlock the next question after answering
            if (idx > 0 && prev.questions[idx - 1]?.id === questionId && !q.isUnlocked) {
              return { ...q, isUnlocked: true };
            }
            return q;
          }),
          answeredCount: prev.answeredCount + 1,
        };
      });

      try {
        const res = await fetch('/api/mbti/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, answer }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '답변 제출에 실패했습니다.');
        }

        // Refetch to get accurate server state (including level, mbtiType)
        await fetchProgress();
      } catch {
        // Revert optimistic update on failure
        await fetchProgress();
        setError('답변 제출에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, fetchProgress]
  );

  const retry = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    isSubmitting,
    submitAnswer,
    retry,
  };
}
