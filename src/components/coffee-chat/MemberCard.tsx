'use client';

import type { DiscoverableMember } from '@/types/coffee-chat';

interface MemberCardProps {
  member: DiscoverableMember;
  isAuthenticated: boolean;
  onRequestClick: (member: DiscoverableMember) => void;
}

export default function MemberCard({
  member,
  isAuthenticated,
  onRequestClick,
}: MemberCardProps) {
  const disabled = member.hasPendingChat || !isAuthenticated;

  let buttonLabel = '\u2615 \ucee4\ud53c\ucc57 \uc2e0\uccad';
  if (member.hasPendingChat) {
    buttonLabel = '\uc774\ubbf8 \uc694\uccad\ub428';
  } else if (!isAuthenticated) {
    buttonLabel = '\ub85c\uadf8\uc778 \ud544\uc694';
  }

  return (
    <div className="border border-primary/10 bg-surface p-4">
      <div className="flex items-center gap-3 mb-2">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary/60">
            {member.displayName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary truncate">
            {member.displayName}
          </p>
          <p className="text-xs text-primary/40">
            {'\uba85\ud568 '}{member.cardCount}{'\uac1c'}
          </p>
        </div>
      </div>

      {member.bio && (
        <p className="text-xs text-primary/60 line-clamp-2 mb-1">
          {member.bio}
        </p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onRequestClick(member)}
        className={`w-full mt-3 py-2 text-xs font-medium border transition-colors duration-150 ${
          disabled
            ? 'border-primary/20 text-primary/30 cursor-not-allowed'
            : 'border-primary text-primary hover:bg-primary hover:text-secondary'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
