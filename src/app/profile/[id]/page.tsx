import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, getUserCards } from '@/lib/profile-storage';
import { ProfileClient } from './ProfileClient';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate OG metadata from the user's profile data.
 */
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profileData = await getProfile(id);

  if (!profileData) {
    return {
      title: '프로필을 찾을 수 없습니다 | Namecard',
    };
  }

  const { profile, cardCount } = profileData;

  return {
    title: `${profile.displayName} | Namecard`,
    description: profile.bio || `${profile.displayName}님의 명함 ${cardCount}장`,
    openGraph: {
      title: `${profile.displayName} | Namecard`,
      description: profile.bio || `${profile.displayName}님의 명함 ${cardCount}장`,
      ...(profile.avatarUrl && { images: [{ url: profile.avatarUrl }] }),
    },
  };
}

/**
 * Profile page (Server Component).
 * Fetches profile data and user's cards, then delegates rendering to ProfileClient.
 * If the profile is not found, renders 404.
 * If the profile is not public (and the viewer is not the owner), shows a private message.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  const profileData = await getProfile(id);

  if (!profileData) {
    notFound();
  }

  const { profile, cardCount, totalLikes, themeDistribution } = profileData;

  // If profile is not public, show private message
  // Note: In a full implementation, we would check if the current viewer is the owner.
  // For now, we show the private message for non-public profiles.
  if (!profile.isPublic) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-600">비공개 프로필입니다</h1>
          <p className="mt-2 text-sm text-gray-400">이 프로필은 비공개로 설정되어 있습니다.</p>
        </div>
      </div>
    );
  }

  // Fetch user's public cards (first page)
  const { cards, total: totalCardPages } = await getUserCards(id, 1, 20);

  return (
    <ProfileClient
      profile={profile}
      cardCount={cardCount}
      totalLikes={totalLikes}
      themeDistribution={themeDistribution}
      initialCards={cards}
      totalCards={totalCardPages}
    />
  );
}
