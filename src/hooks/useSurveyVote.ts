'use client';

import { useState, useCallback } from 'react';
import type { SurveyDetail } from '@/types/survey';

export function useSurveyVote() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(
    async (
      survey: SurveyDetail,
      optionIds: string[],
      onUpdate: (survey: SurveyDetail) => void
    ) => {
      setIsVoting(true);
      setError(null);

      // Optimistic update
      const previousSurvey = { ...survey };
      const optimisticSurvey: SurveyDetail = {
        ...survey,
        hasVoted: true,
        userVotes: optionIds,
        totalVotes: survey.totalVotes + 1,
        options: survey.options.map((opt) => ({
          ...opt,
          voteCount: optionIds.includes(opt.id)
            ? opt.voteCount + 1
            : opt.voteCount,
        })),
      };
      onUpdate(optimisticSurvey);

      try {
        const res = await fetch(`/api/surveys/${survey.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionIds }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '투표에 실패했습니다.');
        }

        const updatedSurvey = await res.json();
        onUpdate(updatedSurvey);
      } catch (err) {
        // Rollback
        onUpdate(previousSurvey);
        const message = err instanceof Error ? err.message : '투표에 실패했습니다.';
        setError(message);
      } finally {
        setIsVoting(false);
      }
    },
    []
  );

  return {
    vote,
    isVoting,
    error,
  };
}
