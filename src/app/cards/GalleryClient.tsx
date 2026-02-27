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
              명함 갤러리
            </h1>
            {totalCards > 0 && (
              <span className="text-sm sm:text-base text-[#fcfcfc]/40 font-mono">
                {totalCards}
              </span>
            )}
          </div>
        </div>
      </header>

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
