'use client';

import Link from 'next/link';
import type { FeedCardData, CardTheme } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';

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
 * Feed card thumbnail with Berlin Photobook minimal style.
 * Clean image display with text information below the image.
 */
export function FeedCardThumbnail({ card }: FeedCardThumbnailProps) {
  const theme: CardTheme = card.theme || 'classic';
  const config = themeConfig[theme] ?? themeConfig.classic;
  const imgSrc = card.illustrationUrl
    ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
    : card.originalAvatarUrl
      ? convertGoogleDriveUrl(card.originalAvatarUrl) || card.originalAvatarUrl
      : null;

  return (
    <div className="group relative">
      {/* Card body - navigates to card detail */}
      <Link
        href={`/cards/${card.id}`}
        className="block"
      >
        {/* Image container */}
        <div
          className="relative w-full aspect-[29/45] overflow-hidden transition-opacity duration-300 group-hover:opacity-80"
          style={{
            backgroundColor: config.bgColor,
            border: '1px solid rgba(2,9,18,0.06)',
          }}
        >
          {/* Illustration image - full card cover, no overlays */}
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
              <span style={{ color: config.accentColor, opacity: 0.3, fontSize: '11px' }}>
                No Image
              </span>
            </div>
          )}
        </div>

        {/* Text below image */}
        <div className="pt-2.5 pb-1 font-[family-name:var(--font-figtree),sans-serif]">
          {/* Display name */}
          <p className="text-sm font-medium text-[#020912] leading-snug truncate">
            {card.displayName}
          </p>

          {/* User info */}
          {card.userId ? (
            <p className="text-xs text-[#020912]/40 mt-0.5 truncate">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/profile/${card.userId}`;
                }}
                className="cursor-pointer hover:text-[#020912]/60 transition-colors"
              >
                {card.userDisplayName || 'Anonymous'}
              </span>
              {card.likeCount > 0 && (
                <span className="ml-2 text-[#020912]/30">
                  {card.likeCount}
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-[#020912]/30 mt-0.5">
              Anonymous
            </p>
          )}

          {/* Theme label */}
          <p className="text-[10px] text-[#020912]/30 uppercase tracking-wide mt-1">
            {config.label}
          </p>
        </div>
      </Link>
    </div>
  );
}
