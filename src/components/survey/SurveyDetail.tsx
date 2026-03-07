'use client';

import { useCallback } from 'react';
import { useSurveyDetail } from '@/hooks/useSurveyDetail';
import { useSurveyVote } from '@/hooks/useSurveyVote';
import { HashtagChip } from '@/components/community/HashtagChip';
import { SurveyVoteUI } from './SurveyVoteUI';
import { SurveyResults } from './SurveyResults';
import { OfficialBadge } from './OfficialBadge';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

interface SurveyDetailProps {
  surveyId: string;
  isAuthenticated: boolean;
}

export function SurveyDetail({ surveyId, isAuthenticated }: SurveyDetailProps) {
  const { survey, setSurvey, loading, error, refetch } = useSurveyDetail(surveyId);
  const { vote, isVoting } = useSurveyVote();

  const handleVote = useCallback(
    (optionIds: string[]) => {
      if (!survey) return;
      vote(survey, optionIds, (updated) => setSurvey(updated));
    },
    [survey, vote, setSurvey]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-xs text-red-500">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 px-3 py-1 text-xs font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-[#020912]/30">설문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const showVoteUI = isAuthenticated && !survey.hasVoted && !survey.isClosed;
  const showResults = survey.hasVoted || survey.isClosed;

  return (
    <div>
      {/* Author + time + badges */}
      <div className="flex items-center gap-2 mb-4">
        {survey.author.avatarUrl ? (
          <img
            src={survey.author.avatarUrl}
            alt={survey.author.displayName}
            className="w-8 h-8 object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-[#020912]/10 flex items-center justify-center text-sm font-medium text-[#020912]/50">
            {survey.author.displayName.charAt(0)}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#020912]">
            {survey.author.displayName}
          </span>
          <span className="text-xs text-[#020912]/30">
            {getRelativeTime(survey.createdAt)}
          </span>
        </div>
        {survey.isOfficial && <OfficialBadge />}
        {survey.isClosed && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#020912]/10 text-[#020912]/50 font-medium">
            마감
          </span>
        )}
      </div>

      {/* Question */}
      <h2 className="text-lg font-semibold text-[#020912] leading-relaxed mb-2">
        {survey.question}
      </h2>

      {/* Select mode indicator */}
      <p className="text-xs text-[#020912]/40 mb-4">
        {survey.selectMode === 'single' ? '단일 선택' : '복수 선택 가능'}
      </p>

      {/* Close time */}
      {survey.closesAt && (
        <p className="text-xs text-[#020912]/40 mb-4">
          마감: {new Date(survey.closesAt).toLocaleString('ko-KR')}
        </p>
      )}

      {/* Vote UI or Results */}
      <div className="mb-4">
        {showVoteUI && (
          <SurveyVoteUI
            survey={survey}
            onVote={handleVote}
            isVoting={isVoting}
          />
        )}
        {showResults && <SurveyResults survey={survey} />}
        {!isAuthenticated && !survey.hasVoted && !survey.isClosed && (
          <p className="text-xs text-[#020912]/40 py-4 text-center">
            투표하려면 로그인이 필요합니다.
          </p>
        )}
      </div>

      {/* Hashtags */}
      {survey.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[rgba(2,9,18,0.08)]">
          {survey.hashtags.map((tag) => (
            <HashtagChip key={tag} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
