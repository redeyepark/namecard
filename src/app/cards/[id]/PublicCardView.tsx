'use client';

import { useState } from 'react';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { QRCodeModal } from '@/components/card/QRCodeModal';
import { generateVCard } from '@/lib/qrcode';
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

  const downloadVCard = () => {
    const vcard = generateVCard(card.card);
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.card.front.displayName || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <AdminCardPreview
          card={card.card}
          illustrationUrl={card.illustrationUrl}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {/* Primary action: Save contact */}
        <button
          type="button"
          onClick={downloadVCard}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/90 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 1.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM3 12.5c0-2.21 2.239-4 5-4s5 1.79 5 4v.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 4.5v3M14 6h-3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          명함 저장
        </button>

        {/* Secondary action: QR code */}
        <button
          type="button"
          onClick={() => setShowQR(true)}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#f5f5f5] transition-colors"
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
      </div>

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
