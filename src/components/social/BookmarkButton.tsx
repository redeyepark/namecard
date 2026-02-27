'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useBookmark } from '@/hooks/useBookmark';

interface BookmarkButtonProps {
  cardId: string;
  initialBookmarked: boolean;
}

/**
 * Bookmark button with optimistic UI.
 * Only renders when the user is authenticated.
 */
export function BookmarkButton({ cardId, initialBookmarked }: BookmarkButtonProps) {
  const { user } = useAuth();
  const { bookmarked, isLoading, toggle } = useBookmark(cardId, initialBookmarked);

  // Don't render if user is not authenticated
  if (!user) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoading) {
      toggle();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center transition-colors duration-150 disabled:opacity-70 ${
        bookmarked ? 'text-[#020912]' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label={bookmarked ? '북마크 해제' : '북마크'}
    >
      <svg
        className="w-5 h-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}
