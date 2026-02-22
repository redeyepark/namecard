'use client';

import { useState } from 'react';
import type { CardData } from '@/types/card';

interface AdminCardPreviewProps {
  card: CardData;
  illustrationUrl: string | null;
}

function AdminFront({
  displayName,
  illustrationUrl,
  backgroundColor,
  textColor,
}: {
  displayName: string;
  illustrationUrl: string | null;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <div
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* Layer 2: Illustration image - full card cover */}
      {illustrationUrl ? (
        <img
          src={illustrationUrl}
          alt="Card illustration"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black/5 flex items-center justify-center">
          <span className="text-black/30 text-xs sm:text-sm">No Image</span>
        </div>
      )}

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-xl sm:text-2xl font-bold tracking-wide truncate"
          title={displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: (textColor || '#FFFFFF').toUpperCase() === '#FFFFFF'
              ? '1px rgba(0, 0, 0, 0.8)'
              : '1px rgba(255, 255, 255, 0.6)',
            color: textColor || '#FFFFFF',
            paintOrder: 'stroke fill',
          }}
        >
          {displayName || 'YOUR NAME'}
        </h1>
      </div>
    </div>
  );
}

function AdminBack({
  fullName,
  title,
  hashtags,
  socialLinks,
  backgroundColor,
  textColor,
}: {
  fullName: string;
  title: string;
  hashtags: string[];
  socialLinks: { platform: string; url: string; label: string }[];
  backgroundColor: string;
  textColor: string;
}) {
  // Derive divider border color from textColor with 20% opacity
  const dividerColor = `${textColor || '#000000'}33`;

  return (
    <div
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor }}
    >
      {/* Upper area (~80%): Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="text-lg sm:text-xl font-bold mb-1 truncate"
          title={fullName || 'FULL NAME'}
          style={{ color: textColor || '#000000' }}
        >
          {fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-xs sm:text-sm mb-4 line-clamp-2"
          title={title || 'Your Title'}
          style={{ color: textColor || '#000000', opacity: 0.9 }}
        >
          {title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {hashtags.map((tag, i) => (
            <span
              key={i}
              className="font-medium text-xs sm:text-sm"
              style={{ color: textColor || '#000000' }}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom area (~20%): Social links with horizontal dividers */}
      {socialLinks.length > 0 && (
        <div className="mt-2">
          {socialLinks.map((link, i) => (
            <div key={i}>
              <div
                className="border-t"
                style={{ borderColor: dividerColor }}
              />
              <p
                className="text-xs py-1.5 truncate text-left"
                style={{ color: textColor || '#000000', opacity: 0.8 }}
              >
                {link.label || link.url}
              </p>
            </div>
          ))}
          {/* Final bottom divider */}
          <div
            className="border-t"
            style={{ borderColor: dividerColor }}
          />
        </div>
      )}
    </div>
  );
}

export function AdminCardPreview({
  card,
  illustrationUrl,
}: AdminCardPreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  return (
    <div>
      <div className="max-w-xs mx-auto">
        {side === 'front' ? (
          <AdminFront
            displayName={card.front.displayName}
            illustrationUrl={illustrationUrl}
            backgroundColor={card.front.backgroundColor}
            textColor={card.front.textColor}
          />
        ) : (
          <AdminBack
            fullName={card.back.fullName}
            title={card.back.title}
            hashtags={card.back.hashtags}
            socialLinks={card.back.socialLinks}
            backgroundColor={card.back.backgroundColor}
            textColor={card.back.textColor}
          />
        )}
      </div>

      <div className="flex justify-center mt-3">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setSide('front')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              side === 'front'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={side === 'front'}
          >
            앞면
          </button>
          <button
            type="button"
            onClick={() => setSide('back')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              side === 'back'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={side === 'back'}
          >
            뒷면
          </button>
        </div>
      </div>
    </div>
  );
}
