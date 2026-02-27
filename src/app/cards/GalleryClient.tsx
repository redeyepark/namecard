'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GalleryEventGroup, FeedCardData } from '@/types/card';
import { GalleryCardThumbnail } from '@/components/gallery/GalleryCardThumbnail';
import { FeedContainer } from '@/components/feed/FeedContainer';

interface GalleryClientProps {
  groups: GalleryEventGroup[];
  totalCards: number;
  feedCards?: FeedCardData[];
  feedCursor?: string | null;
  feedHasMore?: boolean;
}

/**
 * Format a date string (ISO or YYYY-MM-DD) to Korean locale display.
 */
function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Client component for the public card gallery.
 * Supports two view modes: feed (default) and event-grouped.
 */
export function GalleryClient({
  groups,
  totalCards,
  feedCards = [],
  feedCursor = null,
  feedHasMore = false,
}: GalleryClientProps) {
  const [viewMode, setViewMode] = useState<'feed' | 'events'>('feed');

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
          <div className="flex items-baseline gap-3">
            <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              명함 갤러리
            </h1>
            {totalCards > 0 && (
              <span className="text-sm sm:text-base text-[#fcfcfc]/40 font-mono">
                {totalCards}
              </span>
            )}
          </div>
          <p className="font-[family-name:var(--font-anonymous-pro),monospace] mt-2 text-sm sm:text-base text-[#fcfcfc]/60">
            참가자들의 명함을 둘러보세요
          </p>
        </div>
      </header>

      {/* Gallery content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 mb-6">
          <button
            onClick={() => setViewMode('feed')}
            className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              viewMode === 'feed'
                ? 'bg-[#020912] text-[#fcfcfc]'
                : 'bg-transparent text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)]'
            }`}
            aria-pressed={viewMode === 'feed'}
          >
            피드
          </button>
          <button
            onClick={() => setViewMode('events')}
            className={`px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              viewMode === 'events'
                ? 'bg-[#020912] text-[#fcfcfc]'
                : 'bg-transparent text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)]'
            }`}
            aria-pressed={viewMode === 'events'}
          >
            이벤트별
          </button>
        </div>

        {/* Feed view */}
        {viewMode === 'feed' && (
          <FeedContainer
            initialCards={feedCards}
            initialCursor={feedCursor}
            initialHasMore={feedHasMore}
          />
        )}

        {/* Event-grouped view */}
        {viewMode === 'events' && (
          <>
            {groups.length === 0 || totalCards === 0 ? (
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
                  아직 등록된 명함이 없습니다
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  명함이 등록되면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {groups.map((group) => (
                  <section key={group.eventId ?? '__unassigned'}>
                    {/* Event group header */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {group.eventName}
                      </h2>
                      {group.eventDate && (
                        <span className="text-sm text-gray-400">
                          {formatEventDate(group.eventDate)}
                        </span>
                      )}
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        {group.cards.length}
                      </span>
                    </div>

                    {/* Subtle separator line */}
                    <div className="border-b border-gray-200 mb-5" />

                    {/* Card grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {group.cards.map((card) => (
                        <GalleryCardThumbnail key={card.id} card={card} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
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
