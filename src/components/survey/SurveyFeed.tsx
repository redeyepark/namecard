'use client';

import { useState, useCallback } from 'react';
import { useSurveys } from '@/hooks/useSurveys';
import { useSurveyCreate } from '@/hooks/useSurveyCreate';
import { Button } from '@/components/ui';
import { SurveyCard } from './SurveyCard';
import { SurveyFilters } from './SurveyFilters';
import { SurveyForm } from './SurveyForm';
import type { CreateSurveyInput } from '@/types/survey';

interface SurveyFeedProps {
  isAuthenticated: boolean;
}

export function SurveyFeed({ isAuthenticated }: SurveyFeedProps) {
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [tag, setTag] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    surveys,
    officialSurveys,
    loading,
    error,
    hasMore,
    sentinelRef,
    retry,
  } = useSurveys({ sort, tag });

  const { createSurvey, isCreating } = useSurveyCreate();

  const handleTagClick = useCallback((clickedTag: string) => {
    setTag((prev) => (prev === clickedTag ? null : clickedTag));
  }, []);

  const handleCreateSurvey = useCallback(
    async (input: CreateSurveyInput) => {
      await createSurvey(input);
    },
    [createSurvey]
  );

  return (
    <div className="relative">
      <SurveyFilters
        currentSort={sort}
        currentTag={tag}
        onSortChange={setSort}
        onTagClear={() => setTag(null)}
      />

      {/* Official surveys (pinned) */}
      {officialSurveys.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {officialSurveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}

      {/* Survey list */}
      {surveys.length > 0 ? (
        <div className="flex flex-col gap-3">
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-primary/30">
            아직 설문이 없습니다. 첫 번째 설문을 만들어보세요!
          </p>
        </div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin h-5 w-5 text-primary/30"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-xs text-error">{error}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={retry}
            className="mt-2"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && surveys.length > 0 && !loading && (
        <p className="text-center py-8 text-xs text-primary/20">
          더 이상 설문이 없습니다
        </p>
      )}

      {/* Sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

      {/* FAB: Create survey button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center bg-primary text-secondary shadow-lg hover:bg-primary/80 transition-all duration-200 z-40"
          aria-label="설문 만들기"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Survey creation modal */}
      <SurveyForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSurvey}
        isCreating={isCreating}
      />
    </div>
  );
}
