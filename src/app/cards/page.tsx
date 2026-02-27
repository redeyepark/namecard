import type { Metadata } from 'next';
import { getGalleryCards, getFeedCards } from '@/lib/storage';
import { GalleryClient } from './GalleryClient';

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
 * Fetches both feed data (for feed view) and gallery data (for event-grouped view).
 * Feed view is the default.
 */
export default async function GalleryPage() {
  // Fetch feed and gallery data in parallel
  const [galleryData, feedData] = await Promise.all([
    getGalleryCards(),
    getFeedCards({ limit: 12, sort: 'newest' }),
  ]);

  return (
    <GalleryClient
      groups={galleryData.groups}
      totalCards={galleryData.totalCards}
      feedCards={feedData.cards}
      feedCursor={feedData.nextCursor}
      feedHasMore={feedData.hasMore}
    />
  );
}
