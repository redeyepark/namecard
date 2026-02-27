'use client';

import { useState } from 'react';
import type { CardData } from '@/types/card';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { CardDataProvider } from '@/components/card/CardDataProvider';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';

interface AdminCardPreviewProps {
  card: CardData;
  illustrationUrl: string | null;
}

/**
 * AdminCardPreview - Thin wrapper that uses CardDataProvider to render
 * the real card theme components with prop-based data instead of the Zustand store.
 * Supports ALL themes (Classic, Pokemon, Hearthstone, Harry Potter, Tarot, Nametag, Custom).
 */
export function AdminCardPreview({ card, illustrationUrl }: AdminCardPreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  // Merge illustration URL into card's front.avatarImage for preview
  const resolvedUrl = illustrationUrl
    ? convertGoogleDriveUrl(illustrationUrl) || illustrationUrl
    : null;
  const previewCard: CardData = resolvedUrl
    ? { ...card, front: { ...card.front, avatarImage: resolvedUrl } }
    : card;

  return (
    <CardDataProvider card={previewCard}>
      <div>
        <div className="max-w-xs mx-auto">
          {side === 'front' ? <CardFront /> : <CardBack />}
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
    </CardDataProvider>
  );
}
