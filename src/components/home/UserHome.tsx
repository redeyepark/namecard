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
 * Premium lifestyle brand aesthetic with generous whitespace and refined typography.
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
        <div className="bg-[var(--color-surface)] border-b border-[rgba(2,9,18,0.06)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
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
        <div className="bg-[var(--color-surface)] py-10 text-center border-b border-[rgba(2,9,18,0.06)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            프로필 정보를 불러올 수 없습니다.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Primary action - prominent */}
          <Link
            href="/create"
            className="group flex flex-col gap-3 px-5 py-5 bg-[#020912] text-[#fcfcfc] transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
          >
            <svg className="w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <div>
              <span className="block text-sm font-semibold font-[family-name:var(--font-figtree),sans-serif]">새 명함</span>
              <span className="block mt-1 text-xs opacity-50 font-[family-name:var(--font-anonymous-pro),monospace]">새로운 명함 디자인</span>
            </div>
          </Link>
          {/* Secondary actions */}
          <Link
            href="/dashboard"
            className="group flex flex-col gap-3 px-5 py-5 bg-white text-[#020912] border border-[rgba(2,9,18,0.1)] transition-all duration-200 hover:shadow-sm hover:-translate-y-[1px] hover:border-[rgba(2,9,18,0.25)]"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#020912]/40 group-hover:text-[#020912]/70 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div>
              <span className="block text-sm font-semibold font-[family-name:var(--font-figtree),sans-serif]">내 요청</span>
              <span className="block mt-1 text-xs text-[#020912]/40 font-[family-name:var(--font-anonymous-pro),monospace]">제작 현황 확인</span>
            </div>
          </Link>
          <Link
            href="/cards"
            className="group flex flex-col gap-3 px-5 py-5 bg-white text-[#020912] border border-[rgba(2,9,18,0.1)] transition-all duration-200 hover:shadow-sm hover:-translate-y-[1px] hover:border-[rgba(2,9,18,0.25)]"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#020912]/40 group-hover:text-[#020912]/70 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <div>
              <span className="block text-sm font-semibold font-[family-name:var(--font-figtree),sans-serif]">갤러리</span>
              <span className="block mt-1 text-xs text-[#020912]/40 font-[family-name:var(--font-anonymous-pro),monospace]">다른 명함 구경하기</span>
            </div>
          </Link>
          <Link
            href="/dashboard/settings"
            className="group flex flex-col gap-3 px-5 py-5 bg-white text-[#020912] border border-[rgba(2,9,18,0.1)] transition-all duration-200 hover:shadow-sm hover:-translate-y-[1px] hover:border-[rgba(2,9,18,0.25)]"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#020912]/40 group-hover:text-[#020912]/70 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <span className="block text-sm font-semibold font-[family-name:var(--font-figtree),sans-serif]">설정</span>
              <span className="block mt-1 text-xs text-[#020912]/40 font-[family-name:var(--font-anonymous-pro),monospace]">프로필 설정</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Card grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Section header */}
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-lg font-[family-name:var(--font-card),serif] text-[var(--color-text-primary)]">
            내 명함
          </h2>
          {filteredCards.length > 0 && (
            <span className="text-xs font-[family-name:var(--font-anonymous-pro),monospace] text-[var(--color-text-tertiary)]">
              {filteredCards.length}
            </span>
          )}
        </div>

        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredCards.map((card) => (
              <GalleryCardThumbnail key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32">
            {selectedTheme !== null ? (
              <>
                {/* Decorative line */}
                <div className="w-8 border-t border-[rgba(2,9,18,0.15)] mb-8" aria-hidden="true" />
                <p className="text-lg font-[family-name:var(--font-card),serif] text-[var(--color-text-tertiary)]">
                  해당 테마의 카드가 없습니다
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedTheme(null)}
                  className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-4 transition-colors font-[family-name:var(--font-anonymous-pro),monospace]"
                >
                  전체 카드 보기
                </button>
                {/* Decorative line */}
                <div className="w-8 border-t border-[rgba(2,9,18,0.15)] mt-8" aria-hidden="true" />
              </>
            ) : (
              <>
                {/* Decorative line */}
                <div className="w-8 border-t border-[rgba(2,9,18,0.15)] mb-8" aria-hidden="true" />
                <p className="text-lg font-[family-name:var(--font-card),serif] text-[var(--color-text-primary)]">
                  나만의 명함을 만들어보세요
                </p>
                <p className="mt-2 text-xs font-[family-name:var(--font-anonymous-pro),monospace] text-[var(--color-text-tertiary)]">
                  당신만의 특별한 디자인으로 첫 명함을 완성하세요
                </p>
                <Link
                  href="/create"
                  className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-[#020912] text-[#fcfcfc] text-sm font-semibold font-[family-name:var(--font-figtree),sans-serif] hover:bg-[#020912]/90 transition-colors"
                >
                  첫 번째 명함 만들기
                </Link>
                {/* Decorative line */}
                <div className="w-8 border-t border-[rgba(2,9,18,0.15)] mt-8" aria-hidden="true" />
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
 * Refined with subtle shadow and taller height for premium feel.
 */
function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <Link
            href="/"
            className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-bold text-[#020912] hover:text-[#020912]/80 transition-colors"
          >
            Namecard
          </Link>
          <span className="hidden sm:inline text-[10px] tracking-[0.15em] uppercase text-[#020912]/30 font-[family-name:var(--font-anonymous-pro),monospace]">
            Studio
          </span>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
