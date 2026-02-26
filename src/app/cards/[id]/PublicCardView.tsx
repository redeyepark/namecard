'use client';

import { useState } from 'react';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { QRCodeModal } from '@/components/card/QRCodeModal';
import type { PublicCardData } from '@/types/card';

interface PublicCardViewProps {
  card: PublicCardData;
}

/**
 * Client component for public card display with front/back toggle.
 * Reuses AdminCardPreview which already supports all 5 themes.
 */
export function PublicCardView({ card }: PublicCardViewProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <AdminCardPreview
          card={card.card}
          illustrationUrl={card.illustrationUrl}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowQR(true)}
        className="mt-4 inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#f5f5f5] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="3" y="3" width="2" height="2" fill="currentColor" />
          <rect x="11" y="3" width="2" height="2" fill="currentColor" />
          <rect x="3" y="11" width="2" height="2" fill="currentColor" />
          <rect x="9" y="9" width="2" height="2" fill="currentColor" />
          <rect x="13" y="9" width="2" height="2" fill="currentColor" />
          <rect x="9" y="13" width="2" height="2" fill="currentColor" />
          <rect x="13" y="13" width="2" height="2" fill="currentColor" />
          <rect x="11" y="11" width="2" height="2" fill="currentColor" />
        </svg>
        QR 코드
      </button>

      <p className="mt-4 text-xs text-gray-400">
        {card.card.front.displayName}
      </p>

      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        cardId={card.id}
        card={card.card}
        illustrationUrl={card.illustrationUrl}
        isPublic={true}
      />
    </div>
  );
}
