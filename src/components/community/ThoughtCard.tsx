'use client';

import Link from 'next/link';
import type { ThoughtWithAuthor } from '@/types/question';
import { ThoughtLikeButton } from './ThoughtLikeButton';

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

interface ThoughtCardProps {
  thought: ThoughtWithAuthor;
  onDelete?: (thoughtId: string) => void;
  onLikeChange?: (thoughtId: string, liked: boolean, likeCount: number) => void;
}

export function ThoughtCard({ thought, onDelete, onLikeChange }: ThoughtCardProps) {
  const handleDelete = () => {
    if (window.confirm('이 답변을 삭제하시겠습니까?')) {
      onDelete?.(thought.id);
    }
  };

  return (
    <div className="py-4 border-b border-[rgba(2,9,18,0.08)]">
      {/* Author info */}
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/profile/${thought.author.id}`} className="flex items-center gap-2 group">
          {thought.author.avatarUrl ? (
            <img
              src={thought.author.avatarUrl}
              alt={thought.author.displayName}
              className="w-6 h-6 object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-[#020912]/10 flex items-center justify-center text-[10px] font-medium text-[#020912]/50">
              {thought.author.displayName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-[#020912] group-hover:underline">
            {thought.author.displayName}
          </span>
        </Link>
        <span className="text-xs text-[#020912]/30">
          {getRelativeTime(thought.createdAt)}
        </span>
        {thought.isOwner && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#020912]/5 text-[#020912]/50">
            내 답변
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-[#020912]/80 leading-relaxed whitespace-pre-wrap">
        {thought.content}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <ThoughtLikeButton
          thoughtId={thought.id}
          initialLiked={thought.isLiked}
          initialCount={thought.likeCount}
          onLikeChange={(liked, likeCount) =>
            onLikeChange?.(thought.id, liked, likeCount)
          }
        />

        {thought.isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-[#020912]/30 hover:text-red-500 transition-all duration-200"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
