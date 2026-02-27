'use client';

import { useEffect, useState } from 'react';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { LikeButton } from '@/components/social/LikeButton';
import { BookmarkButton } from '@/components/social/BookmarkButton';
import { generateVCard } from '@/lib/qrcode';
import type { PublicCardData } from '@/types/card';

interface PublicCardViewProps {
  card: PublicCardData;
}

/**
 * Client component for public card display with front/back toggle.
 * Reuses AdminCardPreview which already supports all 5 themes.
 * Includes like and bookmark buttons with optimistic UI.
 */
export function PublicCardView({ card }: PublicCardViewProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  // Fetch initial like/bookmark status on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const [likeRes, bookmarkRes] = await Promise.allSettled([
          fetch(`/api/cards/${card.id}/like`),
          fetch(`/api/cards/${card.id}/bookmark`),
        ]);

        if (cancelled) return;

        if (likeRes.status === 'fulfilled' && likeRes.value.ok) {
          const likeData = await likeRes.value.json();
          setLiked(likeData.liked ?? false);
        }

        if (bookmarkRes.status === 'fulfilled' && bookmarkRes.value.ok) {
          const bookmarkData = await bookmarkRes.value.json();
          setBookmarked(bookmarkData.bookmarked ?? false);
        }
      } catch {
        // Silently fail - defaults to false
      } finally {
        if (!cancelled) setStatusLoaded(true);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [card.id]);

  const downloadVCard = () => {
    const vcard = generateVCard(card.card);
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.card.front.displayName || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <AdminCardPreview
          card={card.card}
          illustrationUrl={card.illustrationUrl}
        />
      </div>

      <div className="mt-4 w-full max-w-sm flex items-center justify-between">
        {statusLoaded && (
          <div className="flex items-center gap-2">
            <LikeButton
              cardId={card.id}
              initialLiked={liked}
              initialCount={card.likeCount ?? 0}
              size="md"
              variant="default"
            />
            <BookmarkButton
              cardId={card.id}
              initialBookmarked={bookmarked}
            />
          </div>
        )}
        {!statusLoaded && <div />}

        <button
          type="button"
          onClick={downloadVCard}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/90 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 1.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM3 12.5c0-2.21 2.239-4 5-4s5 1.79 5 4v.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 4.5v3M14 6h-3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          명함 저장
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {card.card.front.displayName}
      </p>
    </div>
  );
}
