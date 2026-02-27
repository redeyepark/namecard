'use client';

import { useRouter } from 'next/navigation';
import type { RequestSummary } from '@/types/request';
import type { CardTheme } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { renderMultiLine } from '@/lib/text-utils';

interface AdminGalleryCardProps {
  request: RequestSummary;
}

/**
 * Theme-specific visual configuration for admin gallery card thumbnails.
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
 * Status label mapping and color configuration for all 7 admin statuses.
 */
const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  submitted: { label: '접수', bgColor: '#3B82F6', textColor: '#FFFFFF' },
  processing: { label: '진행중', bgColor: '#F59E0B', textColor: '#000000' },
  revision_requested: { label: '수정요청', bgColor: '#EF4444', textColor: '#FFFFFF' },
  confirmed: { label: '확정', bgColor: '#10B981', textColor: '#FFFFFF' },
  rejected: { label: '반려', bgColor: '#6B7280', textColor: '#FFFFFF' },
  delivered: { label: '전달완료', bgColor: '#8B5CF6', textColor: '#FFFFFF' },
  cancelled: { label: '취소', bgColor: '#9CA3AF', textColor: '#000000' },
};

/**
 * Admin gallery card thumbnail for the admin dashboard gallery view.
 * Shows illustration image, display name, theme badge, and status indicator.
 * Navigates to admin detail page on click.
 */
export function AdminGalleryCard({ request }: AdminGalleryCardProps) {
  const router = useRouter();
  const theme = (request.theme as CardTheme) || 'classic';
  // Fallback to classic config for custom themes not in the built-in themeConfig
  const config = themeConfig[theme] ?? themeConfig.classic;
  const imgSrc = request.illustrationUrl
    ? convertGoogleDriveUrl(request.illustrationUrl) || request.illustrationUrl
    : null;
  const status = statusConfig[request.status];

  const handleClick = () => {
    router.push(`/admin/${request.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/admin/${request.id}`);
    }
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${request.displayName || 'Card'} - ${status?.label || request.status}`}
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
            alt={request.displayName || 'Card'}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
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
            {renderMultiLine(request.displayName)}
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
    </div>
  );
}
