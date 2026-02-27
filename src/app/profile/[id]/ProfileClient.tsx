'use client';

import { useState, useMemo } from 'react';
import type { UserProfile } from '@/types/profile';
import type { GalleryCardData } from '@/types/card';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { GalleryCardThumbnail } from '@/components/gallery/GalleryCardThumbnail';

interface ProfileClientProps {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
  initialCards: GalleryCardData[];
  totalCards: number;
}

/**
 * Client component for the profile page.
 * Minimal layout: ProfileHeader + card grid with theme filtering.
 */
export function ProfileClient({
  profile,
  cardCount,
  totalLikes,
  themeDistribution,
  initialCards,
}: ProfileClientProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Filter cards by selected theme
  const filteredCards = useMemo(() => {
    if (selectedTheme === null) {
      return initialCards;
    }
    return initialCards.filter((card) => {
      const cardTheme = card.theme || 'classic';
      return cardTheme === selectedTheme;
    });
  }, [initialCards, selectedTheme]);

  const handleThemeFilter = (theme: string | null) => {
    setSelectedTheme(theme);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Profile header */}
      <div className="bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ProfileHeader
            profile={profile}
            cardCount={cardCount}
            totalLikes={totalLikes}
            themeDistribution={themeDistribution}
            selectedTheme={selectedTheme}
            onThemeFilter={handleThemeFilter}
          />
        </div>
      </div>

      {/* Card grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredCards.map((card) => (
              <GalleryCardThumbnail key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <p className="text-lg font-medium text-[var(--color-text-tertiary)]">
              {selectedTheme !== null
                ? '해당 테마의 카드가 없습니다'
                : '공개된 카드가 없습니다'}
            </p>
            {selectedTheme !== null && (
              <button
                type="button"
                onClick={() => setSelectedTheme(null)}
                className="mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
              >
                전체 카드 보기
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
