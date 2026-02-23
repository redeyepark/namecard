'use client';

import { useState } from 'react';
import type { CardData } from '@/types/card';
import { extractHandle } from '@/lib/social-utils';

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
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden"
      style={{ backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Layer 2: Illustration image - full card cover */}
      <img
        src={illustrationUrl}
        alt="Confirmed illustration"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-wide truncate"
          title={displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
            color: 'white',
            paintOrder: 'stroke fill',
          }}
        >
          {displayName || 'YOUR NAME'}
        </h1>
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
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Upper area (~80%): Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="text-[30px] font-bold text-black mb-1 truncate"
          title={fullName || 'FULL NAME'}
        >
          {fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-black/90 text-[20px] mb-4 line-clamp-2"
          title={title || 'Your Title'}
        >
          {title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {hashtags.map((tag, i) => (
            <span key={i} className="text-black font-medium text-[20px]">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom area (~20%): Social links */}
      {(() => {
        const platformOrder = ['email', 'linkedin', 'instagram', 'facebook'];
        const sortedLinks = socialLinks
          .filter((link) => link.url || link.label)
          .sort((a, b) => {
            const aIdx = platformOrder.indexOf(a.platform);
            const bIdx = platformOrder.indexOf(b.platform);
            return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
          });
        return sortedLinks.length > 0 ? (
          <div className="mt-2">
            {sortedLinks.map((link, i) => (
              <p
                key={i}
                className="text-black/80 text-xs py-1.5 truncate text-right"
              >
                {link.platform}/{extractHandle(link.url || link.label)}
              </p>
            ))}
          </div>
        ) : null;
      })()}
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
