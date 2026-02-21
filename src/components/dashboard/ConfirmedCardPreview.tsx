'use client';

import { useState } from 'react';
import type { CardData } from '@/types/card';

interface ConfirmedCardPreviewProps {
  card: CardData;
  illustrationUrl: string;
}

function ConfirmedFront({
  displayName,
  illustrationUrl,
  backgroundColor,
}: {
  displayName: string;
  illustrationUrl: string;
  backgroundColor: string;
}) {
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{ backgroundColor }}
    >
      <div className="p-4 sm:p-6 pt-6 sm:pt-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-white tracking-wide truncate"
          title={displayName || 'YOUR NAME'}
        >
          {displayName || 'YOUR NAME'}
        </h1>
      </div>
      <div className="flex-1 flex items-end justify-center px-4 pb-4">
        <img
          src={illustrationUrl}
          alt="Confirmed illustration"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}

function ConfirmedBack({
  fullName,
  title,
  hashtags,
  socialLinks,
  backgroundColor,
}: {
  fullName: string;
  title: string;
  hashtags: string[];
  socialLinks: { platform: string; url: string; label: string }[];
  backgroundColor: string;
}) {
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor }}
    >
      <div className="flex-1 min-h-0">
        <h2
          className="text-lg sm:text-xl font-bold text-white mb-1 truncate"
          title={fullName || 'FULL NAME'}
        >
          {fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-white/90 text-xs sm:text-sm mb-4 line-clamp-2"
          title={title || 'Your Title'}
        >
          {title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {hashtags.map((tag, i) => (
            <span key={i} className="text-white font-medium text-xs sm:text-sm">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
      {socialLinks.length > 0 && (
        <div className="text-right space-y-0.5 mt-2 overflow-hidden max-h-[4rem]">
          {socialLinks.map((link, i) => (
            <p key={i} className="text-white/80 text-xs italic truncate">
              {link.label || link.url}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfirmedCardPreview({
  card,
  illustrationUrl,
}: ConfirmedCardPreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        확정된 명함
      </h2>

      <div className="max-w-xs mx-auto">
        {side === 'front' ? (
          <ConfirmedFront
            displayName={card.front.displayName}
            illustrationUrl={illustrationUrl}
            backgroundColor={card.front.backgroundColor}
          />
        ) : (
          <ConfirmedBack
            fullName={card.back.fullName}
            title={card.back.title}
            hashtags={card.back.hashtags}
            socialLinks={card.back.socialLinks}
            backgroundColor={card.back.backgroundColor}
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
