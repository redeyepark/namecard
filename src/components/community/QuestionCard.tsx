'use client';

import Link from 'next/link';
import type { QuestionWithAuthor } from '@/types/question';
import { HashtagChip } from './HashtagChip';

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

interface QuestionCardProps {
  question: QuestionWithAuthor;
  onTagClick?: (tag: string) => void;
}

export function QuestionCard({ question, onTagClick }: QuestionCardProps) {
  return (
    <Link
      href={`/community/questions/${question.id}`}
      className="block border border-[rgba(2,9,18,0.15)] p-4 hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
    >
      {/* Author + time */}
      <div className="flex items-center gap-2 mb-3">
        {question.author.avatarUrl ? (
          <img
            src={question.author.avatarUrl}
            alt={question.author.displayName}
            className="w-7 h-7 object-cover"
          />
        ) : (
          <div className="w-7 h-7 bg-[#020912]/10 flex items-center justify-center text-xs font-medium text-[#020912]/50">
            {question.author.displayName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-medium text-[#020912]">
          {question.author.displayName}
        </span>
        <span className="text-xs text-[#020912]/30">
          {getRelativeTime(question.createdAt)}
        </span>
        {question.isOwner && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#020912]/5 text-[#020912]/50">
            내 질문
          </span>
        )}
      </div>

      {/* Content preview (max 3 lines) */}
      <p className="text-sm text-[#020912]/80 leading-relaxed line-clamp-3 mb-3">
        {question.content}
      </p>

      {/* Hashtags */}
      {question.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3" onClick={(e) => e.preventDefault()}>
          {question.hashtags.map((tag) => (
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

      {/* Thought count */}
      <div className="flex items-center gap-1 text-xs text-[#020912]/40">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
        </svg>
        <span>답변 {question.thoughtCount}개</span>
      </div>
    </Link>
  );
}
