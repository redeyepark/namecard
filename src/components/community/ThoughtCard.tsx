'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { ThoughtWithAuthor } from '@/types/question';
import { Button } from '@/components/ui';
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
  onEdit?: (thoughtId: string, content: string) => Promise<void>;
  onLikeChange?: (thoughtId: string, liked: boolean, likeCount: number) => void;
}

export function ThoughtCard({ thought, onDelete, onEdit, onLikeChange }: ThoughtCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = () => {
    if (window.confirm('이 답변을 삭제하시겠습니까?')) {
      onDelete?.(thought.id);
    }
  };

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setEditContent(thought.content);
    setEditError(null);
  }, [thought.content]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(thought.content);
    setEditError(null);
  }, [thought.content]);

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEditError(null);

      const trimmed = editContent.trim();
      if (trimmed.length < 1) {
        setEditError('답변을 입력해주세요.');
        return;
      }
      if (trimmed.length > 1000) {
        setEditError('답변은 최대 1000자까지 입력 가능합니다.');
        return;
      }

      setIsSubmitting(true);
      try {
        await onEdit?.(thought.id, trimmed);
        setIsEditing(false);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : '답변 수정에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [editContent, thought.id, onEdit]
  );

  return (
    <div className="py-4 border-b border-primary/[0.08]">
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
            <div className="w-6 h-6 bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary/50">
              {thought.author.displayName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-primary group-hover:underline">
            {thought.author.displayName}
          </span>
        </Link>
        <span className="text-xs text-primary/30">
          {getRelativeTime(thought.createdAt)}
        </span>
        {thought.isOwner && (
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/5 text-primary/50">
            내 답변
          </span>
        )}
      </div>

      {/* Content or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 resize-none transition-all duration-200"
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs text-primary/30">
              {editContent.length}/1000
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleEditCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || editContent.trim().length < 1}
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
          {editError && (
            <p className="mt-1 text-xs text-error">{editError}</p>
          )}
        </form>
      ) : (
        <>
          <p className="text-sm text-primary/80 leading-relaxed whitespace-pre-wrap">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="text-xs text-primary/30 hover:text-primary/70 transition-all duration-200"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs text-primary/30 hover:text-error transition-all duration-200"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
