'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLike } from '@/hooks/useLike';

interface LikeButtonProps {
  cardId: string;
  initialLiked: boolean;
  initialCount: number;
  /** sm: thumbnails, md: detail page */
  size?: 'sm' | 'md';
  /** overlay: white text for dark backgrounds, default: dark text for light backgrounds */
  variant?: 'overlay' | 'default';
}

/**
 * Like button with optimistic UI and burst animation.
 * Shows a heart icon (outline/filled) and the like count.
 */
export function LikeButton({
  cardId,
  initialLiked,
  initialCount,
  size = 'md',
  variant = 'default',
}: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { liked, count, isLoading, toggle } = useLike(cardId, initialLiked, initialCount);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    if (!isLoading) {
      toggle();
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-sm';

  // Color classes based on variant and liked state
  const likedColor = 'text-red-500';
  const unlikedColor = variant === 'overlay' ? 'text-white/80' : 'text-gray-500';
  const countColor = liked ? likedColor : unlikedColor;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 transition-colors duration-150 disabled:opacity-70 ${countColor}`}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
    >
      <svg
        className={`${iconSize} transition-transform duration-300 ${liked ? 'scale-100' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
        style={liked ? { animation: 'like-burst 300ms ease-out' } : undefined}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {count > 0 && (
        <span className={`${textSize} font-medium`}>
          {count}
        </span>
      )}
    </button>
  );
}
