'use client';

import { QrCode, Share2 } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { ThemeDistribution } from '@/components/profile/ThemeDistribution';

interface ProfileHeaderProps {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
  isOwner?: boolean;
  selectedTheme: string | null;
  onThemeFilter: (theme: string | null) => void;
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
 * Minimal profile header inspired by KakaoTalk.
 * Large centered avatar, name, card count subtitle, two icon buttons, bio, theme chips.
 */
export function ProfileHeader({
  profile,
  cardCount,
  themeDistribution,
  selectedTheme,
  onThemeFilter,
}: ProfileHeaderProps) {
  const avatarSrc = profile.avatarUrl
    ? convertGoogleDriveUrl(profile.avatarUrl) || profile.avatarUrl
    : null;

  const onShareClick = async () => {
    const url = `${window.location.origin}/profile/${profile.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} | Namecard`,
          text: `${profile.displayName}님의 프로필을 확인하세요`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard not available
      }
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-10 sm:py-12">
      {/* Avatar - 120px */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={profile.displayName}
          className="w-[120px] h-[120px] rounded-full object-cover"
          style={{
            boxShadow: '0 0 0 4px var(--color-surface), 0 0 0 6px rgba(2, 9, 18, 0.12), 0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="w-[120px] h-[120px] rounded-full bg-[var(--color-primary)] flex items-center justify-center"
          style={{
            boxShadow: '0 0 0 4px var(--color-surface), 0 0 0 6px rgba(2, 9, 18, 0.12), 0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          <span className="text-3xl font-bold text-[var(--color-secondary)]">
            {getInitials(profile.displayName)}
          </span>
        </div>
      )}

      {/* Name */}
      <h1 className="font-[family-name:var(--font-heading),sans-serif] text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-5">
        {profile.displayName}
      </h1>

      {/* Subtitle: card count */}
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        카드 {cardCount}장
      </p>

      {/* Bio */}
      {profile.bio && (
        <p className="font-[family-name:var(--font-body),monospace] text-sm text-[var(--color-text-secondary)] mt-3 max-w-sm leading-relaxed px-4">
          {profile.bio}
        </p>
      )}

      {/* Two icon buttons: QR + Share */}
      <div className="flex items-center gap-4 mt-5">
        <button
          type="button"
          onClick={() => {
            // QR code action placeholder
          }}
          className="w-10 h-10 rounded-full border border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="QR 코드"
        >
          <QrCode className="w-[18px] h-[18px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onShareClick}
          className="w-10 h-10 rounded-full border border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="프로필 공유"
        >
          <Share2 className="w-[18px] h-[18px]" aria-hidden="true" />
        </button>
      </div>

      {/* Theme filter chips */}
      {themeDistribution.length > 0 && (
        <div className="w-full max-w-md mt-8 px-2">
          <ThemeDistribution
            distribution={themeDistribution}
            selectedTheme={selectedTheme}
            onFilterChange={onThemeFilter}
          />
        </div>
      )}
    </div>
  );
}
