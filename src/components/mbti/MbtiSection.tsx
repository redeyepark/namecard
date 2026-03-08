'use client';

import { useMbtiProgress } from '@/hooks/useMbtiProgress';
import { MbtiQuestionCard } from './MbtiQuestionCard';
import { MbtiLevelBadge } from './MbtiLevelBadge';
import { MbtiResultBadge } from './MbtiResultBadge';

interface MbtiSectionProps {
  isAuthenticated: boolean;
}

export function MbtiSection({ isAuthenticated }: MbtiSectionProps) {
  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="border border-border-medium p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-primary">MBTI</h2>
        </div>
        <p className="text-xs text-primary/40">
          로그인 후 MBTI 진단을 시작해보세요
        </p>
      </div>
    );
  }

  return <MbtiSectionContent />;
}

function MbtiSectionContent() {
  const { progress, loading, error, isSubmitting, submitAnswer, retry } = useMbtiProgress();

  if (loading) {
    return (
      <div className="border border-border-medium p-6 mb-6">
        <div className="flex justify-center py-4">
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
      </div>
    );
  }

  if (error && !progress) {
    return (
      <div className="border border-border-medium p-6 mb-6">
        <p className="text-xs text-error mb-2">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="px-3 py-1 text-xs font-medium text-primary border border-border-medium hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!progress) return null;

  const { questions, answeredCount, totalCount, level, mbtiType } = progress;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="border border-border-medium p-4 mb-px">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-primary">MBTI</h2>
            <MbtiLevelBadge level={level} />
            {mbtiType && <MbtiResultBadge mbtiType={mbtiType} />}
          </div>
          <span className="text-xs text-primary/40">
            {answeredCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-primary/5">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error message (non-blocking) */}
      {error && (
        <div className="px-4 py-2 bg-error/10 border border-error/20 mb-px">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {/* Question cards */}
      <div className="flex flex-col">
        {questions.map((question, index) => (
          <div key={question.id} className="mb-px">
            <MbtiQuestionCard
              question={question}
              index={index}
              onAnswer={submitAnswer}
              isSubmitting={isSubmitting}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
