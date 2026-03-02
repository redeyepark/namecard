'use client';

import { useState, useCallback } from 'react';
import { useQuestions } from '@/hooks/useQuestions';
import { QuestionCard } from './QuestionCard';
import { QuestionFilters } from './QuestionFilters';
import { QuestionForm } from './QuestionForm';

interface QuestionFeedProps {
  isAuthenticated: boolean;
}

export function QuestionFeed({ isAuthenticated }: QuestionFeedProps) {
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [tag, setTag] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    questions,
    loading,
    error,
    hasMore,
    isCreating,
    sentinelRef,
    createQuestion,
    retry,
  } = useQuestions({ sort, tag });

  const handleTagClick = useCallback((clickedTag: string) => {
    setTag((prev) => (prev === clickedTag ? null : clickedTag));
  }, []);

  const handleCreateQuestion = useCallback(
    async (content: string, hashtags: string[]) => {
      await createQuestion(content, hashtags);
    },
    [createQuestion]
  );

  return (
    <div className="relative">
      <QuestionFilters
        currentSort={sort}
        currentTag={tag}
        onSortChange={setSort}
        onTagClear={() => setTag(null)}
      />

      {/* Question list */}
      {questions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-[#020912]/30">
            아직 질문이 없습니다. 첫 번째 질문을 올려보세요!
          </p>
        </div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin h-5 w-5 text-[#020912]/30"
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
          <p className="text-xs text-red-500">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 px-3 py-1 text-xs font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && questions.length > 0 && !loading && (
        <p className="text-center py-8 text-xs text-[#020912]/20">
          더 이상 질문이 없습니다
        </p>
      )}

      {/* Sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

      {/* FAB: Create question button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center bg-[#020912] text-[#fcfcfc] shadow-lg hover:bg-[#020912]/80 transition-all duration-200 z-40"
          aria-label="질문하기"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Question creation modal */}
      <QuestionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateQuestion}
        isCreating={isCreating}
      />
    </div>
  );
}
