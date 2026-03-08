'use client';

import type { SurveyDetail } from '@/types/survey';

interface SurveyResultsProps {
  survey: SurveyDetail;
}

export function SurveyResults({ survey }: SurveyResultsProps) {
  const totalVotes = survey.totalVotes || 1;

  return (
    <div className="flex flex-col gap-2">
      {survey.options.map((option) => {
        const percentage = Math.round((option.voteCount / totalVotes) * 100);
        const isUserVote = survey.userVotes.includes(option.id);

        return (
          <div key={option.id} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-sm ${
                  isUserVote ? 'font-semibold text-primary' : 'text-primary/70'
                }`}
              >
                {option.label}
                {isUserVote && (
                  <svg className="inline-block w-3.5 h-3.5 ml-1 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-primary/50">
                {option.voteCount}표 ({percentage}%)
              </span>
            </div>
            <div className="w-full h-2 bg-primary/5">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isUserVote ? 'bg-primary' : 'bg-primary/40'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-xs text-primary/40 mt-2">
        총 {survey.totalVotes}명 참여
      </p>
    </div>
  );
}
