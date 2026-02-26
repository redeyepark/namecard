'use client';

import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import type { PublicCardData } from '@/types/card';

interface PublicCardViewProps {
  card: PublicCardData;
}

/**
 * Client component for public card display with front/back toggle.
 * Reuses AdminCardPreview which already supports all 5 themes.
 */
export function PublicCardView({ card }: PublicCardViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <AdminCardPreview
          card={card.card}
          illustrationUrl={card.illustrationUrl}
        />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {card.card.front.displayName}
      </p>
    </div>
  );
}
