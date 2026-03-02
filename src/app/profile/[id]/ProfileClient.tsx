'use client';

import { useState, useCallback } from 'react';
import { QrCode, Share2, Settings } from 'lucide-react';
import type { UserProfile, UserLink } from '@/types/profile';
import type { GalleryCardData } from '@/types/card';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SocialIconRow } from '@/components/profile/SocialIconRow';
import { LinkList } from '@/components/profile/LinkList';
import { LinkEditor } from '@/components/profile/LinkEditor';
import { CardPortfolio } from '@/components/profile/CardPortfolio';
import { SocialLinksEditor } from '@/components/profile/SocialLinksEditor';
import CoffeeChatButton from '@/components/coffee-chat/CoffeeChatButton';
import CoffeeChatRequestModal from '@/components/coffee-chat/CoffeeChatRequestModal';
import type { SocialLink, CoffeeChatMethod, CoffeeChatDay, CoffeeChatTime } from '@/types/profile';
import type { MeetingPreference } from '@/types/coffee-chat';

const METHOD_LABELS: Record<CoffeeChatMethod, string> = {
  online: '온라인',
  offline: '오프라인',
  any: '상관없음',
};

const DAY_LABELS: Record<CoffeeChatDay, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

const TIME_LABELS: Record<CoffeeChatTime, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

interface ProfileClientProps {
  profile: UserProfile;
  cardCount: number;
  totalLikes: number;
  themeDistribution: { theme: string; count: number }[];
  initialCards: GalleryCardData[];
  totalCards: number;
  links: UserLink[];
  isOwner: boolean;
  isAuthenticated?: boolean;
  existingChatId?: string;
}

/**
 * Redesigned profile page client component.
 * Vertical Linktree-style layout: header, social icons, links, card portfolio, QR/Share.
 */
export function ProfileClient({
  profile,
  themeDistribution,
  initialCards,
  links,
  isOwner,
  isAuthenticated = false,
  existingChatId,
}: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [showCoffeeChatModal, setShowCoffeeChatModal] = useState(false);

  const handleLinksUpdate = useCallback(() => {
    // Links are managed internally by LinkEditor via useLinks hook
  }, []);

  const handleSocialLinksSave = useCallback(
    async (socialLinks: SocialLink[]) => {
      try {
        const res = await fetch('/api/profiles/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ socialLinks }),
        });
        if (res.ok) {
          const updated = await res.json();
          setCurrentProfile((prev) => ({
            ...prev,
            socialLinks: updated.socialLinks ?? socialLinks,
          }));
          setIsEditing(false);
        }
      } catch {
        // Error handling is silent for now
      }
    },
    []
  );

  const onShareClick = async () => {
    const url = `${window.location.origin}/profile/${currentProfile.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentProfile.displayName} | Namecard`,
          text: `${currentProfile.displayName}님의 프로필을 확인하세요`,
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        {/* 1. Profile Header - avatar, name, bio */}
        <ProfileHeader profile={currentProfile} />

        {/* 2. Social Icons Row */}
        {currentProfile.socialLinks &&
          currentProfile.socialLinks.length > 0 && (
            <SocialIconRow socialLinks={currentProfile.socialLinks} />
          )}

        {/* 2.5 Coffee Chat Button (non-owner only) */}
        {!isOwner && (
          <div className="mt-4 flex justify-center">
            <CoffeeChatButton
              targetUserId={currentProfile.id}
              targetDisplayName={currentProfile.displayName}
              isAuthenticated={isAuthenticated}
              isPublicProfile={currentProfile.isPublic}
              isSelf={isOwner}
              existingChatId={existingChatId}
              onRequestClick={() => setShowCoffeeChatModal(true)}
            />
          </div>
        )}

        {/* Coffee Chat Request Modal */}
        <CoffeeChatRequestModal
          isOpen={showCoffeeChatModal}
          onClose={() => setShowCoffeeChatModal(false)}
          targetUserId={currentProfile.id}
          targetDisplayName={currentProfile.displayName}
          targetAvatarUrl={currentProfile.avatarUrl ?? null}
          onSubmit={async (data: {
            receiverId: string;
            message: string;
            meetingPreference: MeetingPreference;
          }) => {
            const res = await fetch('/api/coffee-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || '커피챗 요청에 실패했습니다.');
            }
            setShowCoffeeChatModal(false);
          }}
        />

        {/* 2.7 Coffee Chat Preferences (if set) */}
        {currentProfile.coffeeChatPreferences && (
          (() => {
            const prefs = currentProfile.coffeeChatPreferences!;
            return (
              <div className="mt-6 border border-[var(--color-divider)] bg-[var(--color-surface)] p-4">
                <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">커피챗 선호</h3>
                {/* Method */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-[#020912] text-[#fcfcfc]">
                    {METHOD_LABELS[prefs.method]}
                  </span>
                  {prefs.region && (
                    <span className="text-xs px-2 py-0.5 border border-[#020912]/20 text-[#020912]/70">
                      {prefs.region}
                    </span>
                  )}
                </div>
                {/* Days */}
                {prefs.days.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {prefs.days.map((d) => (
                      <span key={d} className="text-xs px-1.5 py-0.5 border border-[#020912]/15 text-[#020912]/60">
                        {DAY_LABELS[d]}
                      </span>
                    ))}
                  </div>
                )}
                {/* Times */}
                {prefs.times.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {prefs.times.map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 border border-[#020912]/15 text-[#020912]/60">
                        {TIME_LABELS[t]}
                      </span>
                    ))}
                  </div>
                )}
                {/* Intro */}
                {prefs.intro && (
                  <p className="text-sm text-[#020912]/70 mt-2">{prefs.intro}</p>
                )}
              </div>
            );
          })()
        )}

        {/* 3. Links Section */}
        {isOwner ? (
          <LinkEditor links={links} onUpdate={handleLinksUpdate} />
        ) : (
          links.length > 0 && <LinkList links={links} />
        )}

        {/* 4. Card Portfolio */}
        {initialCards.length > 0 && (
          <CardPortfolio
            cards={initialCards}
            themeDistribution={themeDistribution}
          />
        )}

        {/* 5. QR/Share buttons at bottom */}
        <div className="flex items-center justify-center gap-4 mt-8 pb-8">
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

        {/* 6. Owner: Social Links Editor (shown when editing) */}
        {isOwner && isEditing && (
          <div className="mt-6 pb-8">
            <SocialLinksEditor
              socialLinks={currentProfile.socialLinks ?? []}
              onSave={handleSocialLinksSave}
            />
          </div>
        )}

        {/* 7. Owner: floating edit button */}
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40"
            aria-label={isEditing ? '편집 종료' : '프로필 편집'}
          >
            <Settings
              className={`w-5 h-5 transition-transform ${isEditing ? 'rotate-90' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}
