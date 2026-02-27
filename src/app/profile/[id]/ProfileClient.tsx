'use client';

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
 * Renders ProfileHeader (with ThemeDistribution) and the user's card grid.
 */
export function ProfileClient({
  profile,
  cardCount,
  totalLikes,
  themeDistribution,
  initialCards,
}: ProfileClientProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Navigation header */}
      <div className="bg-[#020912]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/cards"
            className="inline-flex items-center gap-1 text-xs text-[#fcfcfc]/50 hover:text-[#fcfcfc]/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            갤러리로 돌아가기
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-figtree),sans-serif] text-sm font-bold text-[#fcfcfc]/70 hover:text-[#fcfcfc] transition-colors"
          >
            Namecard
          </Link>
        </div>
      </div>

      {/* Profile header (includes theme distribution) */}
      <div className="bg-white border-b border-[rgba(2,9,18,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ProfileHeader
            profile={profile}
            cardCount={cardCount}
            totalLikes={totalLikes}
            themeDistribution={themeDistribution}
          />
        </div>
      </div>

      {/* Card grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {initialCards.length > 0 ? (
          <>
            <h2 className="text-lg font-bold text-[#020912] mb-4">
              카드 목록
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {initialCards.map((card) => (
                <GalleryCardThumbnail key={card.id} card={card} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <p className="text-lg font-medium text-gray-400">
              공개된 카드가 없습니다
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#020912] border-t border-[rgba(2,9,18,0.15)] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/40">
            Namecard Editor
          </p>
        </div>
      </footer>
    </div>
  );
}
