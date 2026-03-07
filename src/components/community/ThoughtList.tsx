'use client';

import type { ThoughtWithAuthor } from '@/types/question';
import { ThoughtCard } from './ThoughtCard';

interface ThoughtListProps {
  thoughts: ThoughtWithAuthor[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sentinelRef: (node?: Element | null) => void;
  onDelete: (thoughtId: string) => void;
  onEdit: (thoughtId: string, content: string) => Promise<void>;
  onLikeChange: (thoughtId: string, liked: boolean, likeCount: number) => void;
  onRetry: () => void;
}

export function ThoughtList({
  thoughts,
  loading,
  error,
  hasMore,
  sentinelRef,
  onDelete,
  onEdit,
  onLikeChange,
  onRetry,
}: ThoughtListProps) {
  if (!loading && thoughts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[#020912]/30">
          아직 답변이 없습니다. 첫 번째로 생각을 공유해 보세요!
        </p>
      </div>
    );
  }

  return (
    <div>
      {thoughts.map((thought) => (
        <ThoughtCard
          key={thought.id}
          thought={thought}
          onDelete={onDelete}
          onEdit={onEdit}
          onLikeChange={onLikeChange}
        />
      ))}

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-6">
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
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-6">
          <p className="text-xs text-red-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 px-3 py-1 text-xs font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* End of list */}
      {!hasMore && thoughts.length > 0 && !loading && (
        <p className="text-center py-6 text-xs text-[#020912]/20">
          모든 답변을 확인했습니다
        </p>
      )}

      {/* Sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
