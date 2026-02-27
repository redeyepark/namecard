'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Share2,
  Download,
  ArrowLeft,
  MoreHorizontal,
  Calendar,
  User,
  Hash,
} from 'lucide-react';
import { CardDataProvider } from '@/components/card/CardDataProvider';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';
import { LikeButton } from '@/components/social/LikeButton';
import { BookmarkButton } from '@/components/social/BookmarkButton';
import { ExportBottomSheet } from '@/components/export/ExportBottomSheet';
import { KakaoShareButton } from '@/components/export/KakaoShareButton';
import { SocialShareButtons } from '@/components/export/SocialShareButtons';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { generateVCard, getCardPublicURL } from '@/lib/qrcode';
import { exportCardAsPng, exportCardAsBlob } from '@/lib/export';
import {
  canShare,
  canCopyImageToClipboard,
  copyTextToClipboard,
  copyImageToClipboard,
  createCompositeImage,
} from '@/lib/share-utils';
import type { PublicCardData, FeedCardData } from '@/types/card';

interface PublicCardViewProps {
  card: PublicCardData;
}

// ── Theme display labels ──────────────────────────────────────────────

const themeLabels: Record<string, string> = {
  classic: 'Classic',
  pokemon: 'Pokemon',
  hearthstone: 'Hearthstone',
  harrypotter: 'Harry Potter',
  tarot: 'Tarot',
  nametag: 'Nametag',
  snsprofile: 'SNS Profile',
};

// ── Helper: get initials for avatar placeholder ───────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// ── Helper: format date for display ───────────────────────────────────

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
 * Client component for public card detail page.
 * KakaoTalk-profile-inspired layout with:
 * - Minimal header (back + more)
 * - Enlarged card with tap-to-flip animation
 * - Creator info section
 * - Similar cards horizontal scroll
 * - Fixed bottom action bar
 */
export function PublicCardView({ card }: PublicCardViewProps) {
  const router = useRouter();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [similarCards, setSimilarCards] = useState<FeedCardData[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Merge illustration URL into card's front.avatarImage for preview
  const resolvedUrl = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : null;
  const previewCard = resolvedUrl
    ? { ...card.card, front: { ...card.card.front, avatarImage: resolvedUrl } }
    : card.card;

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

  // Fetch similar cards (same theme) on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSimilar() {
      try {
        const theme = card.theme || 'classic';
        const res = await fetch(`/api/feed?theme=${theme}&limit=8&sort=popular`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        // Filter out the current card
        const filtered = (data.cards || []).filter(
          (c: FeedCardData) => c.id !== card.id
        );
        setSimilarCards(filtered.slice(0, 6));
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    }

    fetchSimilar();
    return () => { cancelled = true; };
  }, [card.id, card.theme]);

  // Flip card handler
  const handleFlip = useCallback(() => {
    setSide((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  // Download vCard
  const downloadVCard = useCallback(() => {
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
  }, [card.card]);

  // Download current card side as PNG
  const handleDownloadPng = useCallback(async () => {
    const elId = side === 'front' ? 'card-front' : 'card-back';
    const el = document.getElementById(elId);
    if (!el) return;
    const filename = `namecard-${side}.png`;
    await exportCardAsPng(el, filename);
  }, [side]);

  // Share handler
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

    // Fallback: copy link
    const ok = await copyTextToClipboard(url);
    if (ok) {
      alert('링크가 복사되었습니다');
    }
  }, [card.id, card.card.front.displayName]);

  // Card hashtags
  const hashtags = card.card.back?.hashtags || [];
  const createdAt = formatDate(card.createdAt);
  const creatorName = card.userDisplayName || card.card.front.displayName || '';
  const creatorAvatar = card.userAvatarUrl
    ? convertGoogleDriveUrl(card.userAvatarUrl) || card.userAvatarUrl
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* ── Minimal Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 h-14"
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

        <button
          type="button"
          onClick={() => setShowShareMenu(true)}
          className="flex items-center justify-center w-10 h-10 -mr-2 transition-colors hover:bg-black/5 active:bg-black/10"
          aria-label="더보기"
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </header>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="pb-24 md:pb-20">
        {/* ── Card Preview with Flip ─────────────────────────────── */}
        <section className="pt-6 pb-4 px-4">
          <div className="w-[80%] max-w-md mx-auto">
            <CardDataProvider card={previewCard}>
              <div
                ref={cardContainerRef}
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

        {/* ── Creator Info Section ───────────────────────────────── */}
        <section
          className="mx-4 mt-2 mb-4 p-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {/* Creator row */}
          <div className="flex items-center gap-3 mb-3">
            <User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
            {card.userId ? (
              <Link
                href={`/profile/${card.userId}`}
                className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                {creatorAvatar ? (
                  <img
                    src={creatorAvatar}
                    alt={creatorName}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    style={{ border: '1px solid var(--color-divider)' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-divider)',
                    }}
                  >
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                      {getInitials(creatorName)}
                    </span>
                  </div>
                )}
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {creatorName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-divider)',
                  }}
                >
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {getInitials(creatorName)}
                  </span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {creatorName || 'Anonymous'}
                </span>
              </div>
            )}
          </div>

          {/* Date row */}
          {createdAt && (
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {createdAt}
              </span>
            </div>
          )}

          {/* Hashtags row */}
          {hashtags.length > 0 && (
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag, i) => {
                  const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                  return (
                    <span
                      key={i}
                      className="text-sm px-2 py-0.5"
                      style={{
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'var(--color-bg)',
                      }}
                    >
                      {tagText}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Similar Cards Section ──────────────────────────────── */}
        {!similarLoading && similarCards.length > 0 && (
          <section className="mt-2 mb-4">
            <h3
              className="px-4 mb-3 text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              비슷한 명함
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {themeLabels[card.theme] || card.theme}
              </span>
            </h3>
            <div className="similar-cards-scroll px-4">
              {similarCards.map((sc) => (
                <SimilarCardItem key={sc.id} card={sc} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Fixed Bottom Action Bar ─────────────────────────────── */}
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

        {/* Share button */}
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

        {/* Download PNG button */}
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

        {/* vCard download button */}
        <button
          type="button"
          onClick={downloadVCard}
          className="inline-flex items-center gap-1.5 px-3 min-h-[40px] text-sm font-medium text-white transition-colors"
          style={{
            backgroundColor: 'var(--color-primary)',
          }}
          aria-label="연락처 저장"
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
          <span className="hidden sm:inline">명함</span>
        </button>
      </div>

      {/* ── Export/Share Bottom Sheet (triggered by More button) ── */}
      {showShareMenu && (
        <ExportBottomSheet onClose={() => setShowShareMenu(false)}>
          <MoreMenuContent
            cardId={card.id}
            displayName={card.card.front.displayName}
            title={card.card.back.title}
            hashtags={card.card.back.hashtags}
            illustrationUrl={card.illustrationUrl || undefined}
            onClose={() => setShowShareMenu(false)}
          />
        </ExportBottomSheet>
      )}
    </div>
  );
}

// ── Similar Card Thumbnail ────────────────────────────────────────────

const thumbThemeConfig: Record<string, { borderColor: string; bgColor: string; accentColor: string }> = {
  classic: { borderColor: '#020912', bgColor: '#f8f8f8', accentColor: '#020912' },
  pokemon: { borderColor: '#EED171', bgColor: '#808080', accentColor: '#EED171' },
  hearthstone: { borderColor: '#8B6914', bgColor: '#3D2B1F', accentColor: '#D4A76A' },
  harrypotter: { borderColor: '#8B0000', bgColor: '#1a1a2e', accentColor: '#C9A84C' },
  tarot: { borderColor: '#4B0082', bgColor: '#0d0d2b', accentColor: '#9B59B6' },
  nametag: { borderColor: '#374151', bgColor: '#FFFFFF', accentColor: '#374151' },
  snsprofile: { borderColor: '#020912', bgColor: '#020912', accentColor: '#fcfcfc' },
};

function SimilarCardItem({ card }: { card: FeedCardData }) {
  const theme = card.theme || 'classic';
  const config = thumbThemeConfig[theme] ?? thumbThemeConfig.classic;
  const imgSrc = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : null;

  return (
    <Link
      href={`/cards/${card.id}`}
      className="block w-28 group"
    >
      <div
        className="relative w-full aspect-[29/45] overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-lg"
        style={{
          backgroundColor: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={card.displayName || 'Card'}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            <span style={{ color: config.accentColor, opacity: 0.4, fontSize: '10px' }}>
              No Image
            </span>
          </div>
        )}

        {/* Bottom gradient with name */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 p-2 pt-6"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
          }}
        >
          <p className="text-[10px] text-white/90 truncate font-medium">
            {card.displayName}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── More Menu Content (for bottom sheet) ──────────────────────────────

interface MoreMenuContentProps {
  cardId: string;
  displayName: string;
  title: string;
  hashtags: string[];
  illustrationUrl?: string;
  onClose: () => void;
}

function MoreMenuContent({
  cardId,
  displayName,
  title,
  hashtags,
  illustrationUrl,
  onClose,
}: MoreMenuContentProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runAction = useCallback(
    async (id: string, fn: () => Promise<void>) => {
      setActionLoading(id);
      try {
        await fn();
      } catch (err) {
        console.error(`Action "${id}" failed:`, err);
      } finally {
        setActionLoading(null);
        onClose();
      }
    },
    [onClose]
  );

  const handleDownloadFront = useCallback(async () => {
    const el = document.getElementById('card-front');
    if (!el) return;
    await exportCardAsPng(el, 'namecard-front.png');
  }, []);

  const handleDownloadBack = useCallback(async () => {
    const el = document.getElementById('card-back');
    if (!el) return;
    await exportCardAsPng(el, 'namecard-back.png');
  }, []);

  const handleDownloadComposite = useCallback(async () => {
    const frontEl = document.getElementById('card-front');
    const backEl = document.getElementById('card-back');
    if (!frontEl || !backEl) return;
    const [frontBlob, backBlob] = await Promise.all([
      exportCardAsBlob(frontEl),
      exportCardAsBlob(backEl),
    ]);
    const composite = await createCompositeImage(frontBlob, backBlob);
    const url = URL.createObjectURL(composite);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'namecard-composite.png';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleCopyImage = useCallback(async () => {
    const el = document.getElementById('card-front');
    if (!el) return;
    const blob = await exportCardAsBlob(el);
    await copyImageToClipboard(blob);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/cards/${cardId}`;
    await copyTextToClipboard(url);
  }, [cardId]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/cards/${cardId}`;
    try {
      await navigator.share({ title: 'My Namecard', url });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      throw err;
    }
  }, [cardId]);

  const menuItems = [
    { id: 'dl-front', label: '앞면 PNG 다운로드', icon: Download, fn: handleDownloadFront },
    { id: 'dl-back', label: '뒷면 PNG 다운로드', icon: Download, fn: handleDownloadBack },
    { id: 'dl-composite', label: '앞/뒤 합성 PNG 다운로드', icon: Download, fn: handleDownloadComposite },
  ];

  const miscItems = [
    { id: 'copy-image', label: '이미지 복사', icon: Download, fn: handleCopyImage, disabled: !canCopyImageToClipboard() },
    { id: 'copy-link', label: '링크 복사', icon: Share2, fn: handleCopyLink },
    { id: 'share', label: '공유하기', icon: Share2, fn: handleShare, disabled: !canShare() },
  ];

  return (
    <div className="pb-2">
      {/* Download section */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          다운로드
        </span>
      </div>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isLoading = actionLoading === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={isLoading}
            onClick={() => runAction(item.id, item.fn)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left min-h-[44px] transition-colors hover:bg-gray-50 active:bg-gray-100"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            <span className="flex-1">{item.label}</span>
            {isLoading && (
              <span className="shrink-0 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            )}
          </button>
        );
      })}

      <div className="my-1 border-t" style={{ borderColor: 'var(--color-divider)' }} />

      {/* Social share section */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          소셜 공유
        </span>
      </div>
      <div className="px-4 py-2 space-y-3">
        <KakaoShareButton
          cardId={cardId}
          displayName={displayName}
          title={title}
          hashtags={hashtags}
          illustrationUrl={illustrationUrl}
          disabled={false}
        />
        <SocialShareButtons
          url={getCardPublicURL(cardId)}
          title={displayName}
          disabled={false}
        />
      </div>

      <div className="my-1 border-t" style={{ borderColor: 'var(--color-divider)' }} />

      {/* Misc section */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          기타
        </span>
      </div>
      {miscItems.map((item) => {
        const Icon = item.icon;
        const isLoading = actionLoading === item.id;
        const isDisabled = item.disabled || isLoading;
        return (
          <button
            key={item.id}
            type="button"
            disabled={isDisabled}
            onClick={() => runAction(item.id, item.fn)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left min-h-[44px] transition-colors ${
              isDisabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
            style={!isDisabled ? { color: 'var(--color-text-primary)' } : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isLoading && (
              <span className="shrink-0 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            )}
          </button>
        );
      })}

      <div className="h-2" />
    </div>
  );
}
