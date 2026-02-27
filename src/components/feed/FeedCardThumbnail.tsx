'use client';

import Link from 'next/link';
import type { FeedCardData, CardTheme } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { renderMultiLine } from '@/lib/text-utils';

interface FeedCardThumbnailProps {
  card: FeedCardData;
}

/**
 * Theme-specific visual configuration, mirroring GalleryCardThumbnail.
 */
const themeConfig: Record<string, { borderColor: string; label: string; bgColor: string; accentColor: string }> = {
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
 * Get the first letter(s) for an avatar placeholder.
 */
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

/**
 * Extended card thumbnail with user info overlay and like count.
 * Wraps the card image with a bottom overlay showing user avatar, name, and likes.
 */
export function FeedCardThumbnail({ card }: FeedCardThumbnailProps) {
  const theme: CardTheme = card.theme || 'classic';
  const config = themeConfig[theme] ?? themeConfig.classic;
  const imgSrc = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : card.originalAvatarUrl
      ? convertGoogleDriveUrl(card.originalAvatarUrl) || card.originalAvatarUrl
      : null;

  const userAvatarSrc = card.userAvatarUrl
    ? convertGoogleDriveUrl(card.userAvatarUrl) || card.userAvatarUrl
    : null;

  return (
    <div className="group relative">
      {/* Card body - navigates to card detail */}
      <Link
        href={`/cards/${card.id}`}
        className="block"
      >
        <div
          className="relative w-full aspect-[29/45] overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl"
          style={{
            borderRadius: '12px',
            backgroundColor: config.bgColor,
            border: `3px solid ${config.borderColor}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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

          {/* Bottom overlay with user info and like count */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 px-3 py-2.5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            }}
          >
            {/* User info - left side */}
            {card.userId ? (
              <Link
                href={`/profile/${card.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
              >
                {userAvatarSrc ? (
                  <img
                    src={userAvatarSrc}
                    alt={card.userDisplayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 bg-white/20 flex items-center justify-center border border-white/30">
                    <span className="text-[10px] font-bold text-white">
                      {getInitials(card.userDisplayName)}
                    </span>
                  </div>
                )}
                <span className="text-[11px] text-white/90 truncate max-w-[80px]">
                  {card.userDisplayName || 'Anonymous'}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex-shrink-0 bg-white/20 flex items-center justify-center border border-white/30">
                  <span className="text-[10px] font-bold text-white">?</span>
                </div>
                <span className="text-[11px] text-white/60">Anonymous</span>
              </div>
            )}

            {/* Like count - right side */}
            {card.likeCount > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
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
                  {card.likeCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
