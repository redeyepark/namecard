'use client';

import Link from 'next/link';
import { Pencil, QrCode, Share2, Settings, Heart, CreditCard, MoreHorizontal } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { ThemeDistribution } from '@/components/profile/ThemeDistribution';
import { useState } from 'react';

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
 * Profile header with KakaoTalk-inspired centered layout.
 * Large circular avatar, centered name, action bar, stats, bio, and theme filter chips.
 */
export function ProfileHeader({
  profile,
  cardCount,
  totalLikes,
  themeDistribution,
  isOwner = false,
  selectedTheme,
  onThemeFilter,
}: ProfileHeaderProps) {
  const [shareTooltip, setShareTooltip] = useState(false);

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
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
      } catch {
        // Clipboard not available
      }
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-8 sm:py-10">
      {/* Avatar - 120px with ring shadow */}
      <div className="relative">
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
      </div>

      {/* Display name */}
      <h1 className="font-[family-name:var(--font-heading),sans-serif] text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mt-5">
        {profile.displayName}
      </h1>

      {/* Bio */}
      {profile.bio && (
        <p className="font-[family-name:var(--font-body),monospace] text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm leading-relaxed px-4">
          {profile.bio}
        </p>
      )}

      {/* Action bar */}
      <div className="profile-action-bar mt-5">
        {isOwner ? (
          <>
            <Link href="/dashboard/settings" className="profile-action-btn">
              <Pencil aria-hidden="true" />
              <span>편집</span>
            </Link>
            <button
              type="button"
              className="profile-action-btn"
              onClick={() => {
                // QR code action placeholder
              }}
              aria-label="QR 코드"
            >
              <QrCode aria-hidden="true" />
              <span>QR</span>
            </button>
            <button
              type="button"
              className="profile-action-btn relative"
              onClick={onShareClick}
              aria-label="프로필 공유"
            >
              <Share2 aria-hidden="true" />
              <span>공유</span>
              {shareTooltip && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-divider)] px-2 py-0.5 whitespace-nowrap shadow-sm">
                  링크 복사됨
                </span>
              )}
            </button>
            <Link href="/dashboard/settings" className="profile-action-btn">
              <Settings aria-hidden="true" />
              <span>설정</span>
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              className="profile-action-btn"
              onClick={() => {
                // QR code action placeholder
              }}
              aria-label="QR 코드"
            >
              <QrCode aria-hidden="true" />
              <span>QR</span>
            </button>
            <button
              type="button"
              className="profile-action-btn relative"
              onClick={onShareClick}
              aria-label="프로필 공유"
            >
              <Share2 aria-hidden="true" />
              <span>공유</span>
              {shareTooltip && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-divider)] px-2 py-0.5 whitespace-nowrap shadow-sm">
                  링크 복사됨
                </span>
              )}
            </button>
            <button
              type="button"
              className="profile-action-btn"
              onClick={() => {
                // More options placeholder
              }}
              aria-label="더보기"
            >
              <MoreHorizontal aria-hidden="true" />
              <span>더보기</span>
            </button>
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="stats-bar w-full max-w-xs mt-6">
        <div className="stats-item">
          <div className="flex items-center justify-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <span className="stats-value">{cardCount}</span>
          </div>
          <div className="stats-label">카드</div>
        </div>
        <div className="stats-item">
          <div className="flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <span className="stats-value">{totalLikes}</span>
          </div>
          <div className="stats-label">좋아요</div>
        </div>
      </div>

      {/* Theme filter chips */}
      {themeDistribution.length > 0 && (
        <div className="w-full max-w-md mt-6 px-2">
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
