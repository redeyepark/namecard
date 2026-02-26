'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { PublicCardData, CardTheme } from '@/types/card';
import { CardThumbnail } from '@/components/gallery/CardThumbnail';

interface GalleryClientProps {
  initialCards: PublicCardData[];
  total: number;
  page: number;
  totalPages: number;
  theme?: string;
}

/**
 * Theme filter configuration for gallery tabs.
 */
const themeFilters: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'classic', label: 'Classic' },
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'hearthstone', label: 'Hearthstone' },
  { value: 'harrypotter', label: 'Harry Potter' },
  { value: 'tarot', label: 'Tarot' },
];

/**
 * Accent colors for theme filter pills (active state).
 */
const themeAccentColors: Record<string, { bg: string; text: string }> = {
  all: { bg: '#020912', text: '#fcfcfc' },
  classic: { bg: '#020912', text: '#fcfcfc' },
  pokemon: { bg: '#EED171', text: '#000000' },
  hearthstone: { bg: '#8B6914', text: '#fcfcfc' },
  harrypotter: { bg: '#8B0000', text: '#fcfcfc' },
  tarot: { bg: '#4B0082', text: '#fcfcfc' },
};

/**
 * Client component for the public card gallery.
 * Handles theme filtering, pagination navigation, and responsive card grid.
 */
export function GalleryClient({
  initialCards,
  total,
  page,
  totalPages,
  theme,
}: GalleryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTheme = theme || 'all';

  // Build URL with updated search params
  const buildUrl = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(newParams)) {
        if (value && value !== 'all' && value !== '1') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      return qs ? `/cards?${qs}` : '/cards';
    },
    [searchParams]
  );

  // Handle theme filter click
  const handleThemeChange = useCallback(
    (newTheme: string) => {
      router.push(buildUrl({ theme: newTheme, page: undefined }));
    },
    [router, buildUrl]
  );

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (page > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-[#020912] text-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/"
            className="inline-block text-xs text-[#fcfcfc]/50 hover:text-[#fcfcfc]/80 transition-colors mb-4"
          >
            &larr; 홈으로
          </Link>
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            명함 갤러리
          </h1>
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-2 text-sm sm:text-base text-[#fcfcfc]/60">
            참가자들의 공개 명함을 둘러보세요
          </p>
        </div>
      </header>

      {/* Theme filter tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap gap-2">
            {themeFilters.map((filter) => {
              const isActive = activeTheme === filter.value;
              const colors = themeAccentColors[filter.value] || themeAccentColors.all;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleThemeChange(filter.value)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                  style={
                    isActive
                      ? {
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: '#666666',
                          border: '1px solid #d1d5db',
                        }
                  }
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4 sm:mb-6">
          {total > 0
            ? `${total}개의 공개 명함`
            : ''}
        </p>

        {initialCards.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <div className="w-16 h-16 mb-4 text-gray-300">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-400">
              아직 공개된 명함이 없습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">
              명함이 공개되면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            {/* Card grid - responsive: 1 col mobile, 2 tablet, 3 desktop, 4 wide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {initialCards.map((card) => (
                <CardThumbnail key={card.id} card={card} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-1 sm:gap-2 mt-8 sm:mt-12"
                aria-label="Pagination"
              >
                {/* Previous button */}
                <Link
                  href={page > 1 ? buildUrl({ page: String(page - 1), theme: activeTheme }) : '#'}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    page <= 1
                      ? 'text-gray-300 pointer-events-none'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : 0}
                >
                  이전
                </Link>

                {/* Page numbers */}
                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-2 text-sm text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={buildUrl({ page: String(pageNum), theme: activeTheme })}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-[#020912] text-white font-semibold'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                      aria-current={pageNum === page ? 'page' : undefined}
                    >
                      {pageNum}
                    </Link>
                  )
                )}

                {/* Next button */}
                <Link
                  href={page < totalPages ? buildUrl({ page: String(page + 1), theme: activeTheme }) : '#'}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    page >= totalPages
                      ? 'text-gray-300 pointer-events-none'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : 0}
                >
                  다음
                </Link>
              </nav>
            )}
          </>
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
