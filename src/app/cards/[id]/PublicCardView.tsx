'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Download,
  ArrowLeft,
  Calendar,
  Hash,
} from 'lucide-react';
import { CardDataProvider } from '@/components/card/CardDataProvider';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';
import { LikeButton } from '@/components/social/LikeButton';
import { BookmarkButton } from '@/components/social/BookmarkButton';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { getCardPublicURL } from '@/lib/qrcode';
import { exportCardAsPng } from '@/lib/export';
import { canShare, copyTextToClipboard } from '@/lib/share-utils';
import type { PublicCardData } from '@/types/card';

interface PublicCardViewProps {
  card: PublicCardData;
}

// Format date for display
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Public card detail page.
 * Minimal layout: card with flip, creator info, and 4-button action bar.
 */
export function PublicCardView({ card }: PublicCardViewProps) {
  const router = useRouter();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  // Merge illustration URL into card's front.avatarImage for preview
  const resolvedUrl = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : null;
  const previewCard = resolvedUrl
    ? { ...card.card, front: { ...card.card.front, avatarImage: resolvedUrl } }
    : card.card;

  // Fetch initial like/bookmark status
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

  // Flip card
  const handleFlip = useCallback(() => {
    setSide((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  // Download current card side as PNG
  const handleDownloadPng = useCallback(async () => {
    const elId = side === 'front' ? 'card-front' : 'card-back';
    const el = document.getElementById(elId);
    if (!el) return;
    await exportCardAsPng(el, `namecard-${side}.png`);
  }, [side]);

  // Share: native share or fallback to clipboard
  const handleShare = useCallback(async () => {
    const url = getCardPublicURL(card.id);
    const title = card.card.front.displayName || 'Namecard';

    if (canShare()) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    const ok = await copyTextToClipboard(url);
    if (ok) {
      alert('링크가 복사되었습니다');
    }
  }, [card.id, card.card.front.displayName]);

  const hashtags = card.card.back?.hashtags || [];
  const createdAt = formatDate(card.createdAt);
  const creatorName = card.userDisplayName || card.card.front.displayName || '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header: back button only */}
      <header
        className="sticky top-0 z-30 flex items-center px-4 h-14"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 -ml-2 transition-colors hover:bg-black/5 active:bg-black/10"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </header>

      {/* Main content */}
      <main className="pb-24 md:pb-20">
        {/* Card preview with flip */}
        <section className="pt-6 pb-4 px-4">
          <div className="w-[80%] max-w-md mx-auto">
            <CardDataProvider card={previewCard}>
              <div
                className="card-flip-container cursor-pointer"
                onClick={handleFlip}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFlip();
                  }
                }}
                aria-label={side === 'front' ? '뒤집어서 뒷면 보기' : '뒤집어서 앞면 보기'}
              >
                <div className={`card-flip-inner ${side === 'back' ? 'flipped' : ''}`}>
                  <div className="card-flip-face">
                    <CardFront />
                  </div>
                  <div className="card-flip-back">
                    <CardBack />
                  </div>
                </div>
              </div>
            </CardDataProvider>
          </div>

          {/* Flip hint */}
          <p
            className="mt-3 text-center text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            탭하여 뒤집기
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {side === 'front' ? '앞면' : '뒷면'}
            </span>
          </p>
        </section>

        {/* Creator info */}
        <section
          className="mx-4 mt-2 mb-4 p-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {/* Creator name */}
          {creatorName && (
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {creatorName}
              </span>
            </div>
          )}

          {/* Date */}
          {createdAt && (
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {createdAt}
              </span>
            </div>
          )}

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-sm px-2 py-0.5"
                    style={{
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg)',
                    }}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Fixed bottom action bar: Like | Bookmark | Share | Download */}
      <div className="card-action-bar">
        {statusLoaded && (
          <>
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
          </>
        )}

        <div
          className="w-px h-6 mx-1"
          style={{ backgroundColor: 'var(--color-divider)' }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 active:bg-black/10"
          style={{ color: 'var(--color-text-primary)' }}
          aria-label="공유"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">공유</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 active:bg-black/10"
          style={{ color: 'var(--color-text-primary)' }}
          aria-label="이미지 저장"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">저장</span>
        </button>
      </div>
    </div>
  );
}
