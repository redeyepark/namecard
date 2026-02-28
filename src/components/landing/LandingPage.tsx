'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserMenu } from '@/components/auth/UserMenu';
import { UserHome } from '@/components/home/UserHome';
import type { FeedCardData } from '@/types/card';

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function LandingPage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && !!user;

  // Gallery preview state
  const [previewCards, setPreviewCards] = useState<FeedCardData[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Fetch gallery preview cards
  const fetchPreviewCards = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/feed?limit=6&sort=popular');
      if (res.ok) {
        const data = await res.json();
        setPreviewCards(data.cards ?? []);
      }
    } catch {
      // Silently fail - gallery is non-critical
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchPreviewCards();
    }
  }, [isLoading, fetchPreviewCards]);

  // Pick one random card from preview for the hero showcase
  const featuredCard = useMemo(() => {
    if (previewCards.length === 0) return null;
    const idx = Math.floor(Math.random() * previewCards.length);
    return previewCards[idx];
  }, [previewCards]);

  // Loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <svg
          className="animate-spin h-5 w-5 text-[#020912]/30"
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

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">

      {/* ============================================================
          HEADER - Simple, minimal
          ============================================================ */}
      <header className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-8 flex items-center justify-between">
        <span className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-semibold tracking-wide text-[#020912]">
          Namecard
        </span>
        {isAuthenticated ? <UserMenu /> : <LoginButton />}
      </header>

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className={`w-full max-w-5xl mx-auto px-6 sm:px-8 ${
        isAuthenticated ? 'pt-8 sm:pt-12' : 'pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-24'
      }`}>
        {!isAuthenticated && (
          <div>
            <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-tight leading-[1.1] text-[#020912]">
              나만의 색을
              <br />
              찾아보세요
            </h1>

            {/* Featured card showcase */}
            {featuredCard && (
              <div className="mt-12 sm:mt-16 flex justify-center">
                <Link
                  href={`/cards/${featuredCard.id}`}
                  className="block w-full max-w-[320px]"
                >
                  {featuredCard.illustrationUrl ? (
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={featuredCard.illustrationUrl}
                        alt={`${featuredCard.displayName} - ${featuredCard.title}`}
                        fill
                        className="object-cover"
                        sizes="320px"
                        priority
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#020912]/40 to-transparent">
                        <p className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-white/80">
                          {featuredCard.displayName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-[#020912]/[0.03] flex items-end p-6">
                      <div>
                        <p className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-medium text-[#020912]">
                          {featuredCard.displayName}
                        </p>
                        <p className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 mt-1">
                          {featuredCard.title}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================
          USER HOME SECTION - Only for authenticated users
          ============================================================ */}
      {isAuthenticated && (
        <section className="bg-[var(--color-bg)]">
          <UserHome embedded />
        </section>
      )}

      {/* ============================================================
          GALLERY PREVIEW SECTION
          ============================================================ */}
      <section className="w-full max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-24 md:py-32">
        <h2 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl md:text-4xl font-semibold text-[#020912] mb-12 sm:mb-16">
          갤러리
        </h2>

        {/* Gallery grid */}
        {galleryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[#020912]/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : previewCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {previewCards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="group relative aspect-[3/4] bg-[#020912]/[0.03] overflow-hidden"
              >
                {card.illustrationUrl ? (
                  <Image
                    src={card.illustrationUrl}
                    alt={`${card.displayName} - ${card.title}`}
                    fill
                    className="object-cover transition-opacity duration-300 group-hover:opacity-80"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <p className="font-[family-name:var(--font-figtree),sans-serif] text-sm sm:text-base font-medium text-[#020912]/60">
                        {card.displayName}
                      </p>
                      <p className="font-[family-name:var(--font-figtree),sans-serif] text-xs text-[#020912]/30 mt-1">
                        {card.title}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/30">
              아직 공개된 명함이 없습니다
            </p>
          </div>
        )}

        {/* View more link */}
        {previewCards.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <Link
              href="/cards"
              className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 hover:text-[#020912] hover:underline underline-offset-4 transition-all duration-200"
            >
              더 보기 &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* ============================================================
          FOOTER - Minimal, white background
          ============================================================ */}
      <footer className="mt-auto w-full max-w-5xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <nav
          className="flex items-center justify-center gap-4 sm:gap-6 mb-4"
          aria-label="Footer navigation"
        >
          <Link
            href="/cards"
            className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 hover:text-[#020912] transition-opacity duration-200"
          >
            갤러리
          </Link>
          <span className="text-[#020912]/20" aria-hidden="true">&middot;</span>
          <Link
            href="/login"
            className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 hover:text-[#020912] transition-opacity duration-200"
          >
            로그인
          </Link>
          <span className="text-[#020912]/20" aria-hidden="true">&middot;</span>
          <Link
            href="/create"
            className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 hover:text-[#020912] transition-opacity duration-200"
          >
            명함 만들기
          </Link>
        </nav>
        <p className="font-[family-name:var(--font-figtree),sans-serif] text-xs text-[#020912]/20 text-center">
          &copy; 2026 Namecard
        </p>
      </footer>
    </div>
  );
}
