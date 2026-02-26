'use client';

import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
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

      <button
        type="button"
        onClick={downloadVCard}
        className="mt-4 inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/90 transition-colors"
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

      <p className="mt-4 text-xs text-gray-400">
        {card.card.front.displayName}
      </p>
    </div>
  );
}
