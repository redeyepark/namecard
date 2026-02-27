'use client';

import Link from 'next/link';
import type { UserProfile } from '@/types/profile';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { ThemeDistribution } from '@/components/profile/ThemeDistribution';

interface ProfileHeaderProps {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
  isOwnProfile?: boolean;
}

/**
 * Get initials from a display name for avatar placeholder.
 */
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Profile header showing user avatar, display name, bio, stats, and theme distribution.
 * Clean centered layout inspired by social profile headers.
 */
export function ProfileHeader({
  profile,
  cardCount,
  totalLikes,
  themeDistribution,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  const avatarSrc = profile.avatarUrl
    ? convertGoogleDriveUrl(profile.avatarUrl) || profile.avatarUrl
    : null;

  return (
    <div className="flex flex-col items-center text-center py-8 sm:py-12">
      {/* Avatar */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={profile.displayName}
          className="w-24 h-24 rounded-full object-cover border-2 border-[rgba(2,9,18,0.1)]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-[#020912] flex items-center justify-center border-2 border-[rgba(2,9,18,0.1)]">
          <span className="text-2xl font-bold text-[#fcfcfc]">
            {getInitials(profile.displayName)}
          </span>
        </div>
      )}

      {/* Display name */}
      <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-xl sm:text-2xl font-bold text-[#020912] mt-4">
        {profile.displayName}
      </h1>

      {/* Bio */}
      {profile.bio && (
        <p className="font-[family-name:var(--font-anonymous-pro),monospace] text-sm sm:text-base text-[#020912]/60 mt-2 max-w-md leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-6 mt-4">
        <div className="text-sm text-[#020912]/70">
          <span className="font-semibold text-[#020912]">{cardCount}</span>
          {' '}
          카드
        </div>
        <div className="w-px h-4 bg-[rgba(2,9,18,0.15)]" />
        <div className="text-sm text-[#020912]/70">
          <span className="font-semibold text-[#020912]">{totalLikes}</span>
          {' '}
          좋아요
        </div>
      </div>

      {/* Theme distribution */}
      <div className="mt-4">
        <ThemeDistribution distribution={themeDistribution} />
      </div>

      {/* Edit profile link (own profile only) */}
      {isOwnProfile && (
        <Link
          href="/dashboard/settings"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          프로필 편집
        </Link>
      )}
    </div>
  );
}
