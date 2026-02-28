'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserHome } from '@/components/home/UserHome';
import type { FeedCardData } from '@/types/card';

// ------------------------------------------------------------------
// Intersection Observer hook for scroll-triggered fade-in animations
// ------------------------------------------------------------------
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(element);
      }
    }, { threshold: 0.1, ...options });

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

// ------------------------------------------------------------------
// Feature data
// ------------------------------------------------------------------
const features = [
  {
    title: '간편한 입력',
    description: '단계별 위저드로 쉽게 정보를 입력하세요. 복잡한 과정 없이 직관적으로 완성할 수 있습니다.',
    icon: (
      <svg
        className="w-10 h-10 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    ),
  },
  {
    title: '실시간 미리보기',
    description: '입력하는 동안 명함이 어떻게 보이는지 즉시 확인하세요. 결과를 바로 눈으로 확인할 수 있습니다.',
    icon: (
      <svg
        className="w-10 h-10 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: 'PNG 내보내기',
    description: '완성된 명함을 고화질 이미지로 다운로드하세요. 어디서든 활용할 수 있습니다.',
    icon: (
      <svg
        className="w-10 h-10 text-[#020912]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    ),
  },
];

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function LandingPage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && !!user;

  // Gallery preview state
  const [previewCards, setPreviewCards] = useState<FeedCardData[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Section animation refs
  const featuresSection = useInView();
  const gallerySection = useInView();
  const footerSection = useInView();

  // Fetch gallery preview cards for unauthenticated visitors
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
    if (!isLoading && !isAuthenticated) {
      fetchPreviewCards();
    }
  }, [isLoading, isAuthenticated, fetchPreviewCards]);

  // Loading spinner
  if (isLoading) {
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

  // Authenticated users see their home page
  if (isAuthenticated) {
    return <UserHome />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020912]">

      {/* ============================================================
          HERO SECTION - Full viewport height
          ============================================================ */}
      <section className="relative min-h-screen flex flex-col bg-[#020912] text-[#fcfcfc]">
        {/* Header bar */}
        <header className="relative w-full max-w-6xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
          <span className="font-[family-name:var(--font-figtree),sans-serif] text-lg sm:text-xl font-semibold tracking-wide">
            Namecard
          </span>
          <LoginButton />
        </header>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Decorative line */}
            <div className="w-12 h-px bg-[#fcfcfc]/20 mx-auto mb-8" aria-hidden="true" />

            {/* Serif tagline */}
            <p className="font-[family-name:var(--font-card),serif] text-sm tracking-[0.2em] uppercase opacity-60 mb-6">
              너만의 색을 보여줘
            </p>

            {/* Main heading */}
            <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              나만의 명함을
              <br />
              만들어보세요
            </h1>

            {/* Subtitle */}
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-6 sm:mt-8 text-base sm:text-lg text-[#fcfcfc]/50 max-w-xl mx-auto leading-relaxed">
              간단한 5단계로 전문적인 디지털 명함을 완성하세요
            </p>

            {/* Decorative line */}
            <div className="w-12 h-px bg-[#fcfcfc]/20 mx-auto mt-8 mb-10" aria-hidden="true" />

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 px-10 py-4 sm:px-12 sm:py-5 border border-[#fcfcfc]/30 text-[#fcfcfc] text-base sm:text-lg font-medium hover:bg-[#fcfcfc] hover:text-[#020912] hover:border-[#fcfcfc] transition-all duration-300"
              >
                시작하기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/cards"
                className="inline-flex items-center gap-2 px-10 py-4 sm:px-12 sm:py-5 bg-[#ffa639] text-[#020912] text-base sm:text-lg font-medium hover:bg-[#ffa639]/85 transition-all duration-300"
              >
                둘러보기
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-10 flex justify-center" aria-hidden="true">
          <svg
            className="w-5 h-5 text-[#fcfcfc]/30 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION - Refined with generous whitespace
          ============================================================ */}
      <section className="bg-[#fcfcfc] py-24 sm:py-32 md:py-40">
        <div
          ref={featuresSection.ref}
          className={`max-w-5xl mx-auto px-6 sm:px-8 transition-all duration-700 ease-out ${
            featuresSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Section header */}
          <div className="text-center mb-16 sm:mb-20">
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-xs tracking-[0.15em] uppercase text-[#020912]/40 mb-4">
              Features
            </p>
            <h2 className="font-[family-name:var(--font-card),serif] text-2xl sm:text-3xl md:text-4xl text-[#020912]">
              주요 기능
            </h2>
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-4 text-sm sm:text-base text-[#020912]/40 max-w-md mx-auto">
              누구나 쉽게 사용할 수 있는 명함 편집기
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#fcfcfc] p-8 sm:p-10 border border-transparent hover:border-[rgba(2,9,18,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(2,9,18,0.06)]"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="font-[family-name:var(--font-figtree),sans-serif] text-lg sm:text-xl font-semibold text-[#020912] mb-3">
                  {feature.title}
                </h3>
                <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#020912]/45 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          GALLERY PREVIEW SECTION
          ============================================================ */}
      <section className="bg-[#020912] py-24 sm:py-32 md:py-40">
        <div
          ref={gallerySection.ref}
          className={`max-w-5xl mx-auto px-6 sm:px-8 transition-all duration-700 ease-out delay-100 ${
            gallerySection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Section header */}
          <div className="text-center mb-16 sm:mb-20">
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-xs tracking-[0.15em] uppercase text-[#fcfcfc]/30 mb-4">
              Gallery
            </p>
            <h2 className="font-[family-name:var(--font-card),serif] text-2xl sm:text-3xl md:text-4xl text-[#fcfcfc]">
              갤러리
            </h2>
            <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-4 text-sm sm:text-base text-[#fcfcfc]/40 max-w-md mx-auto">
              다른 사용자들이 만든 명함을 구경하세요
            </p>
          </div>

          {/* Gallery grid */}
          {galleryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-[#fcfcfc]/5 animate-pulse"
                />
              ))}
            </div>
          ) : previewCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {previewCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="group relative aspect-[3/4] bg-[#fcfcfc]/5 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                >
                  {card.illustrationUrl ? (
                    <Image
                      src={card.illustrationUrl}
                      alt={`${card.displayName} - ${card.title}`}
                      fill
                      className="object-cover transition-all duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="font-[family-name:var(--font-figtree),sans-serif] text-sm sm:text-base font-medium text-[#fcfcfc]/70">
                          {card.displayName}
                        </p>
                        <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-xs text-[#fcfcfc]/30 mt-1">
                          {card.title}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#020912]/0 group-hover:bg-[#020912]/40 transition-all duration-300 flex items-end">
                    <div className="w-full p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="font-[family-name:var(--font-figtree),sans-serif] text-xs sm:text-sm font-medium text-[#fcfcfc] truncate">
                        {card.displayName}
                      </p>
                      <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-[10px] sm:text-xs text-[#fcfcfc]/60 truncate">
                        {card.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/30">
                아직 공개된 명함이 없습니다
              </p>
            </div>
          )}

          {/* View more link */}
          {previewCards.length > 0 && (
            <div className="mt-12 sm:mt-16 text-center">
              <Link
                href="/cards"
                className="inline-flex items-center gap-2 font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/50 hover:text-[#fcfcfc] transition-colors duration-300"
              >
                더 보기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          FOOTER - Comprehensive with brand identity
          ============================================================ */}
      <footer className="bg-[#020912] border-t border-[#fcfcfc]/[0.06]">
        <div
          ref={footerSection.ref}
          className={`max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20 transition-all duration-700 ease-out ${
            footerSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
            {/* Brand */}
            <div>
              <span className="font-[family-name:var(--font-figtree),sans-serif] text-lg font-semibold text-[#fcfcfc] tracking-wide">
                Namecard
              </span>
              <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-3 text-xs sm:text-sm text-[#fcfcfc]/30 leading-relaxed max-w-xs">
                나만의 개성을 담은 디지털 명함을 만들어보세요. 간결하고 전문적인 자기 소개의 시작.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-[family-name:var(--font-figtree),sans-serif] text-xs tracking-[0.15em] uppercase text-[#fcfcfc]/30 mb-4">
                Links
              </h3>
              <nav aria-label="Footer navigation">
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/cards"
                      className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/50 hover:text-[#fcfcfc] transition-colors duration-200"
                    >
                      갤러리
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/50 hover:text-[#fcfcfc] transition-colors duration-200"
                    >
                      로그인
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/create"
                      className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/50 hover:text-[#fcfcfc] transition-colors duration-200"
                    >
                      명함 만들기
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-[family-name:var(--font-figtree),sans-serif] text-xs tracking-[0.15em] uppercase text-[#fcfcfc]/30 mb-4">
                Social
              </h3>
              <a
                href="#"
                className="inline-flex items-center gap-2 font-[family-name:var(--font-anonymous-pro),monospace] text-sm text-[#fcfcfc]/50 hover:text-[#fcfcfc] transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#fcfcfc]/[0.06] mt-12 sm:mt-16 mb-6 sm:mb-8" aria-hidden="true" />

          {/* Copyright */}
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-xs text-[#fcfcfc]/20 text-center">
            &copy; 2026 Namecard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
