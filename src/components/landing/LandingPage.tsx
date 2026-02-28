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
// Theme background color config
// ------------------------------------------------------------------
const themeConfig: Record<string, { bgColor: string }> = {
  classic:     { bgColor: '#f8f8f8' },
  pokemon:     { bgColor: '#808080' },
  hearthstone: { bgColor: '#3D2B1F' },
  harrypotter: { bgColor: '#1a1a2e' },
  tarot:       { bgColor: '#0d0d2b' },
  nametag:     { bgColor: '#FFFFFF' },
  snsprofile:  { bgColor: '#020912' },
};

function getThemeBgColor(theme: string): string {
  return themeConfig[theme]?.bgColor ?? '#f8f8f8';
}

// Helper to determine if a theme background is dark (for text contrast)
function isThemeDark(theme: string): boolean {
  const bg = getThemeBgColor(theme);
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function LandingPage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && !!user;

  // Cards state (used for featured card selection)
  const [previewCards, setPreviewCards] = useState<FeedCardData[]>([]);

  // Fetch cards for featured card random selection
  const fetchPreviewCards = useCallback(async () => {
    try {
      const res = await fetch('/api/feed?limit=20&sort=popular');
      if (res.ok) {
        const data = await res.json();
        setPreviewCards(data.cards ?? []);
      }
    } catch {
      // Silently fail - non-critical
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
        isAuthenticated ? 'pt-8 sm:pt-12' : 'pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16'
      }`}>
        {!isAuthenticated && (
          <div>
            <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-[#020912]">
              나만의 색을
              <br />
              찾아보세요
            </h1>

            <Link
              href="/login"
              className="font-[family-name:var(--font-figtree),sans-serif] text-base text-[#020912] hover:underline underline-offset-4 inline-block mt-6"
            >
              시작하기 &rarr;
            </Link>

            {/* Featured card front image */}
            {featuredCard && (
              <div className="mt-12 sm:mt-16 flex justify-center">
                <div
                  className="w-full max-w-[320px] overflow-hidden"
                  style={{ backgroundColor: getThemeBgColor(featuredCard.theme) }}
                >
                  {featuredCard.illustrationUrl ? (
                    <Image
                      src={featuredCard.illustrationUrl}
                      alt={featuredCard.displayName}
                      width={320}
                      height={400}
                      className="w-full h-auto"
                      priority
                    />
                  ) : featuredCard.originalAvatarUrl ? (
                    <Image
                      src={featuredCard.originalAvatarUrl}
                      alt={featuredCard.displayName}
                      width={320}
                      height={400}
                      className="w-full h-auto"
                      priority
                    />
                  ) : (
                    <div className="w-full min-h-[200px] flex items-center justify-center">
                      <p
                        className={`font-[family-name:var(--font-figtree),sans-serif] text-base font-medium ${
                          isThemeDark(featuredCard.theme) ? 'text-white/80' : 'text-[#020912]/70'
                        }`}
                      >
                        {featuredCard.displayName}
                      </p>
                    </div>
                  )}
                </div>
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
          FOOTER - Minimal, white background
          ============================================================ */}
      <footer className="mt-auto w-full max-w-5xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <nav
          className="flex items-center justify-center gap-4 sm:gap-6 mb-4"
          aria-label="Footer navigation"
        >
          <Link
            href="/login"
            className="font-[family-name:var(--font-figtree),sans-serif] text-sm text-[#020912]/40 hover:text-[#020912] transition-opacity duration-200"
          >
            갤러리
          </Link>
          <span className="text-[#020912]/20" aria-hidden="true">&middot;</span>
          <Link
            href="/login"
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
