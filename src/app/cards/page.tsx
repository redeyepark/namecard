import type { Metadata } from 'next';
import { getGalleryCards } from '@/lib/storage';
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
 * Fetches all cards grouped by event and delegates rendering to GalleryClient.
 */
export default async function GalleryPage() {
  const { groups, totalCards } = await getGalleryCards();

  return (
    <GalleryClient
      groups={groups}
      totalCards={totalCards}
    />
  );
}
