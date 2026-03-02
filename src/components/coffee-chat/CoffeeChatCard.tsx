'use client';

import type { CoffeeChatWithUsers } from '@/types/coffee-chat';
import { MEETING_PREFERENCE_LABELS } from '@/types/coffee-chat';
import CoffeeChatStatusBadge from './CoffeeChatStatusBadge';
import CoffeeChatActions from './CoffeeChatActions';

interface CoffeeChatCardProps {
  chat: CoffeeChatWithUsers;
  onRespond: (chatId: string, action: string, responseMessage?: string) => Promise<void>;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '\ubc29\uae08 \uc804';
  if (minutes < 60) return `${minutes}\ubd84 \uc804`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}\uc2dc\uac04 \uc804`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}\uc77c \uc804`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function CoffeeChatCard({ chat, onRespond }: CoffeeChatCardProps) {
  const otherPerson = chat.isRequester ? chat.receiver : chat.requester;

  return (
    <div className="border border-[rgba(2,9,18,0.1)] bg-white p-4 mb-3">
      {/* Top row: avatar + name + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {otherPerson.avatarUrl ? (
            <img
              src={otherPerson.avatarUrl}
              alt={otherPerson.displayName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#020912]/10 flex items-center justify-center text-xs font-semibold text-[#020912]/60 flex-shrink-0">
              {otherPerson.displayName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-[#020912] truncate">
            {otherPerson.displayName}
          </span>
        </div>
        <CoffeeChatStatusBadge status={chat.status} />
      </div>

      {/* Message preview */}
      <p className="text-sm text-[#020912]/70 line-clamp-2 mb-2">
        {chat.message}
      </p>

      {/* Meta row: meeting preference + relative time */}
      <div className="flex items-center gap-2 text-xs text-[#020912]/40">
        <span>{MEETING_PREFERENCE_LABELS[chat.meetingPreference]}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{getRelativeTime(chat.createdAt)}</span>
      </div>

      {/* Accepted: show email if available */}
      {chat.status === 'accepted' && otherPerson.email && (
        <div className="mt-3 bg-[#020912]/5 px-3 py-2 text-xs text-[#020912]/70">
          {'\uc774\uba54\uc77c: '}{otherPerson.email}
        </div>
      )}

      {/* Accepted: show response message if available */}
      {chat.status === 'accepted' && chat.responseMessage && (
        <div className="mt-2 px-3 py-2 border-l-2 border-[#020912]/20 text-xs text-[#020912]/60">
          {chat.responseMessage}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3">
        <CoffeeChatActions
          status={chat.status}
          isRequester={chat.isRequester}
          onAccept={() => onRespond(chat.id, 'accept')}
          onDecline={() => onRespond(chat.id, 'decline')}
          onCancel={() => onRespond(chat.id, 'cancel')}
          onComplete={() => onRespond(chat.id, 'complete')}
        />
      </div>
    </div>
  );
}
