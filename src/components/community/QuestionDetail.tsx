'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import type { QuestionWithAuthor } from '@/types/question';
import { useThoughts } from '@/hooks/useThoughts';
import { HashtagChip } from './HashtagChip';
import { ThoughtList } from './ThoughtList';
import { ThoughtForm } from './ThoughtForm';

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

interface QuestionDetailProps {
  question: QuestionWithAuthor;
  isAuthenticated: boolean;
  onDelete?: () => void;
}

export function QuestionDetail({
  question,
  isAuthenticated,
  onDelete,
}: QuestionDetailProps) {
  const {
    thoughts,
    loading,
    error,
    hasMore,
    isCreating,
    sentinelRef,
    createThought,
    deleteThought,
    updateThoughtLike,
    retry,
  } = useThoughts(question.id);

  const handleDelete = useCallback(() => {
    if (window.confirm('이 질문을 삭제하시겠습니까? 모든 답변도 함께 삭제됩니다.')) {
      onDelete?.();
    }
  }, [onDelete]);

  const handleCreateThought = useCallback(
    async (content: string) => {
      await createThought(content);
    },
    [createThought]
  );

  const handleDeleteThought = useCallback(
    async (thoughtId: string) => {
      try {
        await deleteThought(thoughtId);
      } catch {
        // Error handled by hook
      }
    },
    [deleteThought]
  );

  return (
    <div>
      {/* Question header */}
      <div className="pb-4 border-b border-[rgba(2,9,18,0.15)]">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/profile/${question.author.id}`} className="flex items-center gap-2 group">
            {question.author.avatarUrl ? (
              <img
                src={question.author.avatarUrl}
                alt={question.author.displayName}
                className="w-8 h-8 object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-[#020912]/10 flex items-center justify-center text-sm font-medium text-[#020912]/50">
                {question.author.displayName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-[#020912] group-hover:underline">
              {question.author.displayName}
            </span>
          </Link>
          <span className="text-xs text-[#020912]/30">
            {getRelativeTime(question.createdAt)}
          </span>
          {question.isOwner && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#020912]/5 text-[#020912]/50">
              내 질문
            </span>
          )}
        </div>

        {/* Full question content */}
        <p className="text-sm text-[#020912]/80 leading-relaxed whitespace-pre-wrap mb-4">
          {question.content}
        </p>

        {/* Hashtags */}
        {question.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {question.hashtags.map((tag) => (
              <HashtagChip key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Delete button for owner */}
        {question.isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-[#020912]/30 hover:text-red-500 transition-all duration-200"
          >
            질문 삭제
          </button>
        )}
      </div>

      {/* Thoughts section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#020912]">
            답변 {thoughts.length}개
          </span>
        </div>

        <ThoughtList
          thoughts={thoughts}
          loading={loading}
          error={error}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
          onDelete={handleDeleteThought}
          onLikeChange={updateThoughtLike}
          onRetry={retry}
        />

        <ThoughtForm
          isAuthenticated={isAuthenticated}
          isCreating={isCreating}
          onSubmit={handleCreateThought}
        />
      </div>
    </div>
  );
}
