'use client';

import { useThoughtLike } from '@/hooks/useThoughtLike';

interface ThoughtLikeButtonProps {
  thoughtId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function ThoughtLikeButton({
  thoughtId,
  initialLiked,
  initialCount,
  onLikeChange,
}: ThoughtLikeButtonProps) {
  const { liked, count, isLoading, toggle } = useThoughtLike(
    thoughtId,
    initialLiked,
    initialCount
  );

  const handleClick = async () => {
    await toggle();
    onLikeChange?.(!liked, liked ? count - 1 : count + 1);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs transition-all duration-200 ${
        liked
          ? 'text-red-500'
          : 'text-[#020912]/40 hover:text-[#020912]/70'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
    >
      <svg
        className="w-4 h-4"
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
