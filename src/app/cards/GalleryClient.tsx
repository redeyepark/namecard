'use client';

import Link from 'next/link';
import type { FeedCardData } from '@/types/card';
import { FeedContainer } from '@/components/feed/FeedContainer';

interface GalleryClientProps {
  totalCards: number;
  feedCards?: FeedCardData[];
  feedCursor?: string | null;
  feedHasMore?: boolean;
}

/**
 * Client component for the public card gallery.
 * Displays a simple feed view of all cards.
 */
export function GalleryClient({
  totalCards,
  feedCards = [],
  feedCursor = null,
  feedHasMore = false,
}: GalleryClientProps) {
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
              부캐 갤러리
            </h1>
            {totalCards > 0 && (
              <span className="text-sm sm:text-base text-[#fcfcfc]/40 font-mono">
                {totalCards}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Community link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <Link
          href="/community/questions"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          커뮤니티 질문
        </Link>
      </div>

      {/* Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FeedContainer
          initialCards={feedCards}
          initialCursor={feedCursor}
          initialHasMore={feedHasMore}
        />
      </main>
    </div>
  );
}
