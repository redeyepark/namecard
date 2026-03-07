'use client';

import { useState, useCallback } from 'react';
import type { CreateSurveyInput } from '@/types/survey';

export function useSurveyCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSurvey = useCallback(async (input: CreateSurveyInput) => {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '설문 등록에 실패했습니다.');
      }

      const newSurvey = await res.json();
      return newSurvey;
    } catch (err) {
      const message = err instanceof Error ? err.message : '설문 등록에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createSurvey,
    isCreating,
    error,
  };
}
