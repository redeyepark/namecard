import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicCard } from '@/lib/storage';
import { PublicCardView } from './PublicCardView';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Generate Open Graph and Twitter Card metadata for public cards.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getPublicCard(id);

  if (!card) {
    return {
      title: 'Card Not Found',
    };
  }

  const displayName = card.card.front.displayName || 'Business Card';
  const title = card.card.back.title || '';
  const description = title
    ? `${displayName} - ${title}`
    : displayName;

  return {
    title: `${displayName} | Namecard`,
    description,
    openGraph: {
      title: `${displayName} | Namecard`,
      description,
      type: 'profile',
      ...(card.illustrationUrl ? { images: [{ url: card.illustrationUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | Namecard`,
      description,
      ...(card.illustrationUrl ? { images: [card.illustrationUrl] } : {}),
    },
  };
}

/**
 * Public card view page (Server Component).
 * Displays a read-only view of a public card.
 * Returns 404 for private or non-confirmed cards.
 */
export default async function PublicCardPage({ params }: Props) {
  const { id } = await params;
  const card = await getPublicCard(id);

  if (!card) {
    notFound();
  }

  return <PublicCardView card={card} />;
}
