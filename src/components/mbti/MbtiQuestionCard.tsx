'use client';

import type { MbtiQuestionWithStatus } from '@/types/mbti';

interface MbtiQuestionCardProps {
  question: MbtiQuestionWithStatus;
  index: number;
  onAnswer: (questionId: string, answer: 'A' | 'B') => void;
  isSubmitting: boolean;
}

export function MbtiQuestionCard({ question, index, onAnswer, isSubmitting }: MbtiQuestionCardProps) {
  const questionNum = index + 1;

  // Locked state
  if (!question.isUnlocked) {
    return (
      <div className="border border-[rgba(2,9,18,0.08)] p-4 opacity-40 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#020912]/30">Q{questionNum}</span>
          <svg
            className="w-3.5 h-3.5 text-[#020912]/30"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <span className="text-xs text-[#020912]/30">
            답변 후 다음 질문이 열립니다
          </span>
        </div>
      </div>
    );
  }

  // Answered state
  if (question.userAnswer) {
    return (
      <div className="border border-[rgba(2,9,18,0.1)] p-4 transition-all duration-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-[#020912]/50">Q{questionNum}</span>
          <svg
            className="w-3.5 h-3.5 text-[#020912]/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm text-[#020912]/50 mb-3">{question.content}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled
            className={`flex-1 px-3 py-2.5 text-xs text-left transition-all duration-200 ${
              question.userAnswer === 'A'
                ? 'bg-[#020912] text-[#fcfcfc]'
                : 'border border-[rgba(2,9,18,0.08)] text-[#020912]/25'
            }`}
          >
            <span className="font-medium mr-1.5">A.</span>
            {question.optionA}
            {question.userAnswer === 'A' && (
              <svg
                className="inline-block w-3 h-3 ml-1.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            disabled
            className={`flex-1 px-3 py-2.5 text-xs text-left transition-all duration-200 ${
              question.userAnswer === 'B'
                ? 'bg-[#020912] text-[#fcfcfc]'
                : 'border border-[rgba(2,9,18,0.08)] text-[#020912]/25'
            }`}
          >
            <span className="font-medium mr-1.5">B.</span>
            {question.optionB}
            {question.userAnswer === 'B' && (
              <svg
                className="inline-block w-3 h-3 ml-1.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active (unlocked, not answered) state
  return (
    <div className="border border-[rgba(2,9,18,0.3)] p-4 transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-[#020912]">Q{questionNum}</span>
      </div>
      <p className="text-sm text-[#020912] mb-3 leading-relaxed">{question.content}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onAnswer(question.id, 'A')}
          className="flex-1 px-3 py-2.5 text-xs text-left border border-[rgba(2,9,18,0.15)] text-[#020912] hover:bg-[#020912] hover:text-[#fcfcfc] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-medium mr-1.5">A.</span>
          {question.optionA}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onAnswer(question.id, 'B')}
          className="flex-1 px-3 py-2.5 text-xs text-left border border-[rgba(2,9,18,0.15)] text-[#020912] hover:bg-[#020912] hover:text-[#fcfcfc] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-medium mr-1.5">B.</span>
          {question.optionB}
        </button>
      </div>
    </div>
  );
}
