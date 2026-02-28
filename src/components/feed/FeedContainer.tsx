'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import type { FeedCardData } from '@/types/card';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { FeedCardThumbnail } from '@/components/feed/FeedCardThumbnail';

interface FeedContainerProps {
  initialCards: FeedCardData[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

/**
 * Infinite scroll feed container that fetches and displays cards.
 * Uses react-intersection-observer for scroll-triggered loading.
 */
export function FeedContainer({
  initialCards,
  initialCursor,
  initialHasMore,
}: FeedContainerProps) {
  const [cards, setCards] = useState<FeedCardData[]>(initialCards);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [currentTheme, setCurrentTheme] = useState('all');
  const [currentSort, setCurrentSort] = useState<'newest' | 'popular'>('newest');
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Intersection observer for infinite scroll sentinel
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Fetch popular tags on mount
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/feed/tags');
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags ?? []);
        }
      } catch {
        // Silently fail - tags are a non-critical enhancement
      }
    }
    fetchTags();
  }, []);

  /**
   * Fetch cards from the feed API.
   */
  const fetchCards = useCallback(
    async (cursor: string | null, reset: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (currentTheme && currentTheme !== 'all') params.set('theme', currentTheme);
        if (currentTag) params.set('tag', currentTag);
        params.set('sort', currentSort);

        const res = await fetch(`/api/feed?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch feed');

        const data = await res.json();

        if (reset) {
          setCards(data.cards);
        } else {
          setCards((prev) => [...prev, ...data.cards]);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError('피드를 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    },
    [currentTheme, currentSort, currentTag],
  );

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading && nextCursor) {
      fetchCards(nextCursor, false);
    }
  }, [inView, hasMore, loading, nextCursor, fetchCards]);

  // Reset and fetch fresh when filters change
  const handleThemeChange = useCallback(
    (theme: string) => {
      setCurrentTheme(theme);
    },
    [],
  );

  const handleSortChange = useCallback(
    (sort: 'newest' | 'popular') => {
      setCurrentSort(sort);
    },
    [],
  );

  const handleTagChange = useCallback(
    (tag: string | null) => {
      setCurrentTag(tag);
    },
    [],
  );

  // Re-fetch when theme, sort, or tag changes
  useEffect(() => {
    setCards([]);
    setNextCursor(null);
    setHasMore(true);
    fetchCards(null, true);
  }, [currentTheme, currentSort, currentTag, fetchCards]);

  return (
    <div>
      {/* Filters */}
      <FeedFilters
        currentTheme={currentTheme}
        currentSort={currentSort}
        currentTag={currentTag}
        availableTags={availableTags}
        onThemeChange={handleThemeChange}
        onSortChange={handleSortChange}
        onTagChange={handleTagChange}
      />

      {/* Card grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {cards.map((card) => (
            <FeedCardThumbnail key={card.id} card={card} />
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-20 sm:py-32">
          <div className="w-16 h-16 mb-4 text-gray-300">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-full h-full"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-400">
            표시할 카드가 없습니다
          </p>
          <p className="mt-1 text-sm text-gray-400">
            다른 필터를 선택하거나 나중에 다시 확인해주세요
          </p>
        </div>
      ) : null}

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin h-6 w-6 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-center py-8" role="alert">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => fetchCards(nextCursor, false)}
            className="mt-2 px-4 py-1.5 text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && cards.length > 0 && !loading && (
        <p className="text-center py-8 text-sm text-[#020912]/40">
          더 이상 카드가 없습니다
        </p>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
