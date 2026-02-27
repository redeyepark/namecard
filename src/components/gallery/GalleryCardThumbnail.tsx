'use client';

import Link from 'next/link';
import type { GalleryCardData, CardTheme } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { renderMultiLine } from '@/lib/text-utils';

interface GalleryCardThumbnailProps {
  card: GalleryCardData;
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
export function GalleryCardThumbnail({ card }: GalleryCardThumbnailProps) {
  const theme = card.theme || 'classic';
  const config = themeConfig[theme];
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

        {/* Bottom gradient overlay with title */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-8"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
          }}
        >
          {card.title && (
            <p
              className="text-xs text-white/80 truncate"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              {card.title}
            </p>
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
