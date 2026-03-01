'use client';

import type { UserProfile } from '@/types/profile';
import { convertGoogleDriveUrl } from '@/lib/url-utils';

interface ProfileHeaderProps {
  profile: UserProfile;
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
 * Simplified profile header: 80px avatar, name, bio.
 * QR/Share buttons and ThemeDistribution moved out.
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const avatarSrc = profile.avatarUrl
    ? convertGoogleDriveUrl(profile.avatarUrl) || profile.avatarUrl
    : null;

  return (
    <div className="flex flex-col items-center text-center pt-10 pb-4 sm:pt-12 sm:pb-5">
      {/* Avatar - 80px */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={profile.displayName}
          className="w-[80px] h-[80px] rounded-full object-cover"
          style={{
            boxShadow:
              '0 0 0 3px var(--color-surface), 0 0 0 5px rgba(2, 9, 18, 0.10), 0 6px 16px rgba(0, 0, 0, 0.10)',
          }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="w-[80px] h-[80px] rounded-full bg-[var(--color-primary)] flex items-center justify-center"
          style={{
            boxShadow:
              '0 0 0 3px var(--color-surface), 0 0 0 5px rgba(2, 9, 18, 0.10), 0 6px 16px rgba(0, 0, 0, 0.10)',
          }}
        >
          <span className="text-2xl font-bold text-[var(--color-secondary)]">
            {getInitials(profile.displayName)}
          </span>
        </div>
      )}

      {/* Name */}
      <h1 className="font-[family-name:var(--font-heading),sans-serif] text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-4">
        {profile.displayName}
      </h1>

      {/* Bio */}
      {profile.bio && (
        <p className="font-[family-name:var(--font-body),monospace] text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm leading-relaxed px-4">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
