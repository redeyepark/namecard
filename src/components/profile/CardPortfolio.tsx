'use client';

import { useState, useMemo } from 'react';
import type { GalleryCardData } from '@/types/card';
import { GalleryCardThumbnail } from '@/components/gallery/GalleryCardThumbnail';
import { ThemeDistribution } from '@/components/profile/ThemeDistribution';

interface CardPortfolioProps {
  cards: GalleryCardData[];
  themeDistribution: { theme: string; count: number }[];
}

/**
 * Card portfolio section with theme filter chips and card grid.
 * Hidden entirely when no cards exist.
 */
export function CardPortfolio({ cards, themeDistribution }: CardPortfolioProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    if (selectedTheme === null) {
      return cards;
    }
    return cards.filter((card) => {
      const cardTheme = card.theme || 'classic';
      return cardTheme === selectedTheme;
    });
  }, [cards, selectedTheme]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 w-full" aria-label="Card portfolio">
      {/* Section title */}
      <h2 className="font-[family-name:var(--font-heading),sans-serif] text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4">
        Card Portfolio
      </h2>

      {/* Theme filter chips */}
      {themeDistribution.length > 0 && (
        <div className="mb-4">
          <ThemeDistribution
            distribution={themeDistribution}
            selectedTheme={selectedTheme}
            onFilterChange={setSelectedTheme}
          />
        </div>
      )}

      {/* Card grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filteredCards.map((card) => (
            <GalleryCardThumbnail key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {selectedTheme !== null
              ? '해당 테마의 카드가 없습니다'
              : '카드가 없습니다'}
          </p>
          {selectedTheme !== null && (
            <button
              type="button"
              onClick={() => setSelectedTheme(null)}
              className="mt-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              전체 카드 보기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
