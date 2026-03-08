'use client';

import { useState } from 'react';
import type { SurveyDetail } from '@/types/survey';
import { Button } from '@/components/ui';

interface SurveyVoteUIProps {
  survey: SurveyDetail;
  onVote: (optionIds: string[]) => void;
  isVoting: boolean;
}

export function SurveyVoteUI({ survey, onVote, isVoting }: SurveyVoteUIProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (survey.selectMode === 'single') {
      setSelected([optionId]);
    } else {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleVote = () => {
    if (selected.length === 0) return;
    onVote(selected);
  };

  return (
    <div className="flex flex-col gap-2">
      {survey.options.map((option) => {
        const isSelected = selected.includes(option.id);

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={isVoting}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left border transition-all duration-200 ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border-medium hover:border-primary/40'
            } ${isVoting ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {/* Radio / Checkbox indicator */}
            <span
              className={`flex-shrink-0 w-4 h-4 flex items-center justify-center border ${
                survey.selectMode === 'single' ? 'rounded-full' : ''
              } ${
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-primary/30'
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            <span className="text-primary">{option.label}</span>
          </button>
        );
      })}

      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleVote}
        disabled={isVoting || selected.length === 0}
        className="mt-2 w-full"
      >
        {isVoting ? '투표 중...' : '투표하기'}
      </Button>
    </div>
  );
}
