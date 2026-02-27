import type { Metadata } from 'next';
import { getFeedCards, getPublicCardCount } from '@/lib/storage';
import { GalleryClient } from './GalleryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '명함 갤러리 | Namecard',
  description: '참가자들의 명함을 둘러보세요',
  openGraph: {
    title: '명함 갤러리 | Namecard',
    description: '참가자들의 명함을 둘러보세요',
  },
};

/**
 * Public gallery page (Server Component).
 * Fetches feed data for the card gallery.
 */
export default async function GalleryPage() {
  const [feedData, totalCards] = await Promise.all([
    getFeedCards({ limit: 12, sort: 'newest' }),
    getPublicCardCount(),
  ]);

  return (
    <GalleryClient
      totalCards={totalCards}
      feedCards={feedData.cards}
      feedCursor={feedData.nextCursor}
      feedHasMore={feedData.hasMore}
    />
  );
}
