'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/auth/UserMenu';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { GalleryCardThumbnail } from '@/components/gallery/GalleryCardThumbnail';
import type { ProfilePageData } from '@/types/profile';
import type { GalleryCardData } from '@/types/card';

/**
 * Authenticated user's home page.
 * Shows the user's own profile (avatar, name, bio, stats, cards)
 * with quick action links.
 */
export function UserHome() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfilePageData | null>(null);
  const [cards, setCards] = useState<GalleryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile and cards in parallel
        const [profileRes, cardsRes] = await Promise.all([
          fetch(`/api/profiles/${user!.id}`),
          fetch(`/api/profiles/${user!.id}/cards?limit=50`),
        ]);

        if (profileRes.ok) {
          const pData: ProfilePageData = await profileRes.json();
          setProfileData(pData);
        }

        if (cardsRes.ok) {
          const cData = await cardsRes.json();
          setCards(cData.cards ?? []);
        }
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Filter cards by selected theme
  const filteredCards = useMemo(() => {
    if (selectedTheme === null) return cards;
    return cards.filter((card) => (card.theme || 'classic') === selectedTheme);
  }, [cards, selectedTheme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020912]">
        <svg
          className="animate-spin h-6 w-6 text-white/40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex flex-col items-center justify-center py-20" role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile;
  const cardCount = profileData?.cardCount ?? 0;
  const totalLikes = profileData?.totalLikes ?? 0;
  const themeDistribution = profileData?.themeDistribution ?? [];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />

      {/* Profile header */}
      {profile ? (
        <div className="bg-[var(--color-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ProfileHeader
              profile={profile}
              cardCount={cardCount}
              totalLikes={totalLikes}
              themeDistribution={themeDistribution}
              isOwner
              selectedTheme={selectedTheme}
              onThemeFilter={setSelectedTheme}
            />
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] py-10 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            프로필 정보를 불러올 수 없습니다.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/create"
            className="flex items-center gap-2 px-4 py-3 bg-[#020912] text-[#fcfcfc] hover:bg-[#020912]/90 transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>새 명함</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-3 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span>내 요청</span>
          </Link>
          <Link
            href="/cards"
            className="flex items-center gap-2 px-4 py-3 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span>갤러리</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-3 bg-white text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-colors text-sm font-semibold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>설정</span>
          </Link>
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
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            {selectedTheme !== null ? (
              <>
                <p className="text-lg font-medium text-[var(--color-text-tertiary)]">
                  해당 테마의 카드가 없습니다
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedTheme(null)}
                  className="mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
                >
                  전체 카드 보기
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-[var(--color-text-tertiary)]">
                  아직 만든 명함이 없습니다
                </p>
                <Link
                  href="/create"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#020912] text-[#fcfcfc] text-sm font-semibold hover:bg-[#020912]/90 transition-colors"
                >
                  첫 번째 명함 만들기
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Minimal header with logo and user menu.
 */
function Header() {
  return (
    <header className="bg-white border-b border-[rgba(2,9,18,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-[#020912] hover:text-[#020912]/80 transition-colors"
        >
          Namecard
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
