'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { GalleryCardThumbnail } from '@/components/gallery/GalleryCardThumbnail';
import type { GalleryCardData } from '@/types/card';

/**
 * Bookmarks management page.
 * Displays all bookmarked cards for the authenticated user.
 */
export default function BookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<GalleryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard/bookmarks');
    }
  }, [authLoading, user, router]);

  // Fetch bookmarks
  useEffect(() => {
    if (!user) return;

    async function fetchBookmarks() {
      try {
        const res = await fetch('/api/bookmarks?page=1&pageSize=20');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCards(data.cards ?? []);
      } catch {
        setError('북마크를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user]);

  // Show spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6 text-gray-400"
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020912]">북마크</h1>
          <p className="mt-1 text-sm text-[#020912]/50">
            저장한 명함을 모아볼 수 있습니다.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#020912] bg-[#e4f6ff] hover:bg-[#e4f6ff]/70 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          대시보드로 돌아가기
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="animate-spin h-6 w-6 mx-auto mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          로딩 중...
        </div>
      ) : error ? (
        <div className="text-center py-12" role="alert">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-[#020912]/20"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          <p className="text-sm text-[#020912]/50">북마크한 카드가 없습니다</p>
          <p className="mt-1 text-xs text-[#020912]/30">
            갤러리에서 마음에 드는 명함을 북마크해보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <GalleryCardThumbnail
              key={card.id}
              card={card}
            />
          ))}
        </div>
      )}
    </div>
  );
}
