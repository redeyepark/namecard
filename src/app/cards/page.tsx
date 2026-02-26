import type { Metadata } from 'next';
import { getPublicCards } from '@/lib/storage';
import { GalleryClient } from './GalleryClient';

export const metadata: Metadata = {
  title: '명함 갤러리 | Namecard',
  description: '참가자들의 공개 명함을 둘러보세요',
  openGraph: {
    title: '명함 갤러리 | Namecard',
    description: '참가자들의 공개 명함을 둘러보세요',
  },
};

/**
 * Public gallery page (Server Component).
 * Fetches initial card data server-side and delegates rendering to GalleryClient.
 */
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; theme?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const theme = params.theme || undefined;
  const limit = 12;

  const { cards, total } = await getPublicCards(page, limit, theme);
  const totalPages = Math.ceil(total / limit);

  return (
    <GalleryClient
      initialCards={cards}
      total={total}
      page={page}
      totalPages={totalPages}
      theme={theme}
    />
  );
}
