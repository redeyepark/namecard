'use client';

import Link from 'next/link';
import type { Survey } from '@/types/survey';
import { HashtagChip } from '@/components/community/HashtagChip';
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

interface SurveyCardProps {
  survey: Survey;
  onTagClick?: (tag: string) => void;
}

export function SurveyCard({ survey, onTagClick }: SurveyCardProps) {
  return (
    <Link
      href={`/community/surveys/${survey.id}`}
      className="block border border-[rgba(2,9,18,0.15)] p-4 hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
    >
      {/* Author + time + badges */}
      <div className="flex items-center gap-2 mb-3">
        {survey.author.avatarUrl ? (
          <img
            src={survey.author.avatarUrl}
            alt={survey.author.displayName}
            className="w-7 h-7 object-cover"
          />
        ) : (
          <div className="w-7 h-7 bg-[#020912]/10 flex items-center justify-center text-xs font-medium text-[#020912]/50">
            {survey.author.displayName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-medium text-[#020912]">
          {survey.author.displayName}
        </span>
        <span className="text-xs text-[#020912]/30">
          {getRelativeTime(survey.createdAt)}
        </span>
        {survey.isOfficial && <OfficialBadge />}
        {survey.isClosed && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#020912]/10 text-[#020912]/50 font-medium">
            마감
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm text-[#020912]/80 leading-relaxed line-clamp-3 mb-3">
        {survey.question}
      </p>

      {/* Options preview */}
      <div className="flex flex-col gap-1.5 mb-3">
        {survey.options.slice(0, 4).map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-2 px-3 py-1.5 border border-[rgba(2,9,18,0.08)] bg-[#020912]/[0.02]"
          >
            <span
              className={`flex-shrink-0 w-3.5 h-3.5 border border-[rgba(2,9,18,0.2)] ${
                survey.selectMode === 'single' ? 'rounded-full' : ''
              }`}
            />
            <span className="text-xs text-[#020912]/60">{option.label}</span>
          </div>
        ))}
        {survey.options.length > 4 && (
          <p className="text-xs text-[#020912]/30 pl-3">
            +{survey.options.length - 4}개 더보기
          </p>
        )}
      </div>

      {/* Hashtags */}
      {survey.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3" onClick={(e) => e.preventDefault()}>
          {survey.hashtags.map((tag) => (
            <HashtagChip
              key={tag}
              tag={tag}
              onClick={(t) => {
                onTagClick?.(t);
              }}
            />
          ))}
        </div>
      )}

      {/* Vote count */}
      <div className="flex items-center gap-1 text-xs text-[#020912]/40">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span>{survey.totalVotes}명 참여</span>
        {survey.selectMode === 'multi' && (
          <span className="text-[#020912]/20 ml-1">복수 선택</span>
        )}
      </div>
    </Link>
  );
}
