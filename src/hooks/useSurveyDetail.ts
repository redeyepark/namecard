'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SurveyDetail } from '@/types/survey';

export function useSurveyDetail(surveyId: string) {
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (!res.ok) throw new Error('Failed to fetch survey');

      const data = await res.json();
      setSurvey(data);
    } catch {
      setError('설문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const refetch = useCallback(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  return {
    survey,
    setSurvey,
    loading,
    error,
    refetch,
  };
}
