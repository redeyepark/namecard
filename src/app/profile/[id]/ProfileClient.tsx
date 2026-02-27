'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
 * Renders ProfileHeader (with theme filter chips) and the user's card grid.
 * Manages theme filtering state to filter cards by selected theme.
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
      {/* Navigation header */}
      <div className="bg-[var(--color-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/cards"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)]/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            갤러리로 돌아가기
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-heading),sans-serif] text-sm font-bold text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] transition-colors"
          >
            Namecard
          </Link>
        </div>
      </div>

      {/* Profile header (includes action bar, stats, theme filter) */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
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
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {selectedTheme !== null ? '필터된 카드' : '카드 목록'}
              </h2>
              {selectedTheme !== null && (
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {filteredCards.length}장
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredCards.map((card) => (
                <GalleryCardThumbnail key={card.id} card={card} />
              ))}
            </div>
          </>
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

      {/* Footer */}
      <footer className="bg-[var(--color-primary)] border-t border-[var(--color-border-dark)] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-[family-name:var(--font-body),monospace] text-sm text-[var(--color-secondary)]/40">
            Namecard Editor
          </p>
        </div>
      </footer>
    </div>
  );
}
