'use client';

import Link from 'next/link';
import type { GalleryCardData, CardTheme } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { renderMultiLine } from '@/lib/text-utils';

interface GalleryCardThumbnailProps {
  card: GalleryCardData;
  /** Optional user ID for profile link overlay */
  userId?: string | null;
  /** Optional user display name for overlay */
  userDisplayName?: string | null;
  /** Optional user avatar URL for overlay */
  userAvatarUrl?: string | null;
  /** Optional like count for overlay */
  likeCount?: number;
}

/**
 * Theme-specific visual configuration for card thumbnails.
 */
const themeConfig: Record<CardTheme, { borderColor: string; label: string; bgColor: string; accentColor: string }> = {
  classic: {
    borderColor: '#020912',
    label: 'Classic',
    bgColor: '#f8f8f8',
    accentColor: '#020912',
  },
  pokemon: {
    borderColor: '#EED171',
    label: 'Pokemon',
    bgColor: '#808080',
    accentColor: '#EED171',
  },
  hearthstone: {
    borderColor: '#8B6914',
    label: 'Hearthstone',
    bgColor: '#3D2B1F',
    accentColor: '#D4A76A',
  },
  harrypotter: {
    borderColor: '#8B0000',
    label: 'Harry Potter',
    bgColor: '#1a1a2e',
    accentColor: '#C9A84C',
  },
  tarot: {
    borderColor: '#4B0082',
    label: 'Tarot',
    bgColor: '#0d0d2b',
    accentColor: '#9B59B6',
  },
  nametag: {
    borderColor: '#374151',
    label: 'Nametag',
    bgColor: '#FFFFFF',
    accentColor: '#374151',
  },
  snsprofile: {
    borderColor: '#020912',
    label: 'SNS Profile',
    bgColor: '#020912',
    accentColor: '#fcfcfc',
  },
};

/**
 * Status label mapping and color configuration.
 */
const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  submitted: { label: '접수', bgColor: '#3B82F6', textColor: '#FFFFFF' },
  processing: { label: '진행중', bgColor: '#F59E0B', textColor: '#000000' },
  confirmed: { label: '확정', bgColor: '#10B981', textColor: '#FFFFFF' },
  delivered: { label: '전달완료', bgColor: '#8B5CF6', textColor: '#FFFFFF' },
};

/**
 * Lightweight card thumbnail for the gallery grid view.
 * Shows the front face with illustration, display name, theme badge, and status indicator.
 * Uses GalleryCardData (lightweight) instead of PublicCardData (full card data).
 */
/**
 * Get the first character of a name for avatar placeholder.
 */
function getInitial(name: string | null | undefined): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function GalleryCardThumbnail({
  card,
  userId,
  userDisplayName,
  userAvatarUrl,
  likeCount,
}: GalleryCardThumbnailProps) {
  const showUserOverlay = userId != null;
  const theme = card.theme || 'classic';
  // Fallback to classic config for custom themes not in the built-in themeConfig
  const config = themeConfig[theme] ?? themeConfig.classic;
  const imgSrc = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : null;
  const status = statusConfig[card.status];

  return (
    <Link
      href={`/cards/${card.id}`}
      className="group block"
    >
      <div
        className="relative w-full aspect-[29/45] overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl"
        style={{
          borderRadius: '12px',
          backgroundColor: config.bgColor,
          border: `3px solid ${config.borderColor}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontFamily: "'Nanum Myeongjo', serif",
        }}
      >
        {/* Illustration image - full card cover */}
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
            <span style={{ color: config.accentColor, opacity: 0.4, fontSize: '12px' }}>
              No Image
            </span>
          </div>
        )}

        {/* Display name overlay at top-left */}
        <div className="relative z-10 p-3">
          <h3
            className="text-sm font-bold tracking-wide leading-tight"
            style={{
              color: '#FFFFFF',
              WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.7)',
              paintOrder: 'stroke fill',
            }}
          >
            {renderMultiLine(card.displayName)}
          </h3>
        </div>

        {/* Bottom gradient overlay with title and optional user info */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-8"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
          }}
        >
          {showUserOverlay ? (
            <div className="flex items-center justify-between">
              {/* User info */}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/profile/${userId}`;
                }}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {userAvatarUrl ? (
                  <img
                    src={convertGoogleDriveUrl(userAvatarUrl) || userAvatarUrl}
                    alt={userDisplayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full flex-shrink-0 bg-white/20 flex items-center justify-center border border-white/30 text-[10px] font-bold text-white">
                    {getInitial(userDisplayName)}
                  </span>
                )}
                <span className="text-[11px] text-white/90 truncate max-w-[80px]">
                  {userDisplayName || 'Anonymous'}
                </span>
              </span>

              {/* Like count */}
              {(likeCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    fill="none"
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
                  <span className="text-[11px] text-white/80 font-medium">
                    {likeCount}
                  </span>
                </span>
              )}
            </div>
          ) : (
            card.title && (
              <p
                className="text-xs text-white/80 truncate"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {card.title}
              </p>
            )
          )}
        </div>

        {/* Theme badge - top right */}
        <div
          className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: config.accentColor,
            color: theme === 'classic' ? '#fcfcfc' : '#000000',
            opacity: 0.9,
          }}
        >
          {config.label}
        </div>

        {/* Status badge - bottom left */}
        {status && (
          <div
            className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: status.bgColor,
              color: status.textColor,
              opacity: 0.9,
            }}
          >
            {status.label}
          </div>
        )}
      </div>
    </Link>
  );
}
