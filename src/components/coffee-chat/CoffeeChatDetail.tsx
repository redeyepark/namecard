'use client';

import type { CoffeeChatWithUsers } from '@/types/coffee-chat';
import { MEETING_PREFERENCE_LABELS } from '@/types/coffee-chat';
import CoffeeChatStatusBadge from './CoffeeChatStatusBadge';
import CoffeeChatActions from './CoffeeChatActions';

interface CoffeeChatDetailProps {
  chat: CoffeeChatWithUsers;
  onRespond: (chatId: string, action: string, responseMessage?: string) => Promise<void>;
  loading?: boolean;
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

function Avatar({ user }: { user: { displayName: string; avatarUrl: string | null } }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary/60">
      {user.displayName.charAt(0)}
    </div>
  );
}

export default function CoffeeChatDetail({
  chat,
  onRespond,
  loading = false,
}: CoffeeChatDetailProps) {
  const otherPerson = chat.isRequester ? chat.receiver : chat.requester;

  return (
    <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
      {/* Header: status + time */}
      <div className="flex items-center justify-between mb-6">
        <CoffeeChatStatusBadge status={chat.status} />
        <span className="text-xs text-primary/40">
          {getRelativeTime(chat.createdAt)}
        </span>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col items-center gap-1 min-w-0">
          <Avatar user={chat.requester} />
          <span className="text-xs font-medium text-primary truncate max-w-[80px]">
            {chat.requester.displayName}
          </span>
          {chat.isRequester && (
            <span className="text-[10px] text-primary/40 border border-primary/15 px-1.5 py-0.5">
              {'\ub098'}
            </span>
          )}
        </div>

        <span className="text-primary/30 text-sm flex-shrink-0" aria-hidden="true">
          &rarr;
        </span>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <Avatar user={chat.receiver} />
          <span className="text-xs font-medium text-primary truncate max-w-[80px]">
            {chat.receiver.displayName}
          </span>
          {!chat.isRequester && (
            <span className="text-[10px] text-primary/40 border border-primary/15 px-1.5 py-0.5">
              {'\ub098'}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-primary/40 mb-1.5">
          {'\uba54\uc2dc\uc9c0'}
        </h3>
        <p className="text-sm text-primary/80 leading-relaxed whitespace-pre-wrap">
          {chat.message}
        </p>
      </div>

      {/* Meeting preference */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-primary/40 mb-1">
          {'\ub9cc\ub0a8 \ubc29\uc2dd'}
        </h3>
        <span className="text-sm text-primary/70">
          {MEETING_PREFERENCE_LABELS[chat.meetingPreference]}
        </span>
      </div>

      {/* Accepted state: email disclosure */}
      {chat.status === 'accepted' && (
        <div className="mb-4 border border-primary/10 bg-primary/[0.03] p-4">
          <h3 className="text-xs font-medium text-primary/40 mb-2">
            {'\uc0c1\ub300\ubc29 \uc774\uba54\uc77c'}
          </h3>
          {otherPerson.email ? (
            <a
              href={`mailto:${otherPerson.email}`}
              className="text-sm text-primary font-medium underline underline-offset-2 hover:text-primary/70 transition-colors"
            >
              {otherPerson.email}
            </a>
          ) : (
            <span className="text-sm text-primary/40">
              {'\uc774\uba54\uc77c \uc815\ubcf4 \uc5c6\uc74c'}
            </span>
          )}
          <p className="text-xs text-primary/40 mt-2">
            {'\uc774\uba54\uc77c\uc774 \uc0c1\ud638 \uacf5\uac1c\ub418\uc5c8\uc2b5\ub2c8\ub2e4'}
          </p>
        </div>
      )}

      {/* Accepted: response message */}
      {chat.status === 'accepted' && chat.responseMessage && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-primary/40 mb-1.5">
            {'\uc751\ub2f5 \uba54\uc2dc\uc9c0'}
          </h3>
          <div className="border-l-2 border-primary/20 pl-3">
            <p className="text-sm text-primary/70 leading-relaxed whitespace-pre-wrap">
              {chat.responseMessage}
            </p>
          </div>
        </div>
      )}

      {/* Completed info */}
      {chat.status === 'completed' && (
        <div className="mb-4 bg-primary text-secondary px-4 py-3 text-sm">
          {'\ub9cc\ub0a8\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4'}
        </div>
      )}

      {/* Actions */}
      <CoffeeChatActions
        status={chat.status}
        isRequester={chat.isRequester}
        loading={loading}
        onAccept={() => onRespond(chat.id, 'accept')}
        onDecline={() => onRespond(chat.id, 'decline')}
        onCancel={() => onRespond(chat.id, 'cancel')}
        onComplete={() => onRespond(chat.id, 'complete')}
      />
    </div>
  );
}
