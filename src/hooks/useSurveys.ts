'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type { Survey } from '@/types/survey';

interface UseSurveysOptions {
  sort?: 'latest' | 'popular';
  tag?: string | null;
}

export function useSurveys(options: UseSurveysOptions = {}) {
  const { sort = 'latest', tag = null } = options;
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [officialSurveys, setOfficialSurveys] = useState<Survey[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  const fetchSurveys = useCallback(
    async (cursor: string | null, reset: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '20');
        params.set('sort', sort);
        if (tag) params.set('tag', tag);

        const res = await fetch(`/api/surveys?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch surveys');

        const data = await res.json();

        if (reset) {
          setSurveys(data.data);
        } else {
          setSurveys((prev) => [...prev, ...data.data]);
        }

        if (data.official) {
          setOfficialSurveys(data.official);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError('설문 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [sort, tag]
  );

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading && nextCursor) {
      fetchSurveys(nextCursor, false);
    }
  }, [inView, hasMore, loading, nextCursor, fetchSurveys]);

  // Re-fetch when sort or tag changes
  useEffect(() => {
    initialFetchDone.current = true;
    setSurveys([]);
    setNextCursor(null);
    setHasMore(true);
    fetchSurveys(null, true);
  }, [sort, tag, fetchSurveys]);

  const retry = useCallback(() => {
    fetchSurveys(nextCursor, false);
  }, [fetchSurveys, nextCursor]);

  return {
    surveys,
    officialSurveys,
    loading,
    error,
    hasMore,
    sentinelRef,
    retry,
  };
}
