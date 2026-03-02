'use client';

import type { CoffeeChatWithUsers } from '@/types/coffee-chat';
import CoffeeChatCard from './CoffeeChatCard';

interface CoffeeChatListProps {
  chats: CoffeeChatWithUsers[];
  hasMore: boolean;
  sentinelRef: (node?: Element | null) => void;
  loading: boolean;
  tab: 'received' | 'sent';
  onTabChange: (tab: 'received' | 'sent') => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRespond: (chatId: string, action: string, responseMessage?: string) => Promise<void>;
}

const TABS: { key: 'received' | 'sent'; label: string }[] = [
  { key: 'received', label: '\ubc1b\uc740 \uc694\uccad' },
  { key: 'sent', label: '\ubcf4\ub0b8 \uc694\uccad' },
];

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '\uc804\uccb4' },
  { key: 'pending', label: '\ub300\uae30\uc911' },
  { key: 'accepted', label: '\uc218\ub77d\ub428' },
];

const EMPTY_MESSAGES: Record<string, string> = {
  received: '\ubc1b\uc740 \ucee4\ud53c\ucc57 \uc694\uccad\uc774 \uc5c6\uc2b5\ub2c8\ub2e4',
  sent: '\ubcf4\ub0b8 \ucee4\ud53c\ucc57 \uc694\uccad\uc774 \uc5c6\uc2b5\ub2c8\ub2e4',
};

function SkeletonChatCard() {
  return (
    <div className="border border-[rgba(2,9,18,0.1)] bg-white p-4 mb-3 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#020912]/10" />
          <div className="h-3.5 bg-[#020912]/10 w-24" />
        </div>
        <div className="h-5 bg-[#020912]/10 w-14" />
      </div>
      <div className="h-3 bg-[#020912]/5 w-full mb-1.5" />
      <div className="h-3 bg-[#020912]/5 w-2/3 mb-2" />
      <div className="h-2.5 bg-[#020912]/5 w-28" />
    </div>
  );
}

export default function CoffeeChatList({
  chats,
  hasMore,
  sentinelRef,
  loading,
  tab,
  onTabChange,
  statusFilter,
  onStatusFilterChange,
  onRespond,
}: CoffeeChatListProps) {
  const showSkeleton = loading && chats.length === 0;
  const showEmpty = !loading && chats.length === 0;

  return (
    <div>
      {/* Tab row */}
      <div className="flex border-b border-[rgba(2,9,18,0.1)] mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`flex-1 pb-2.5 text-sm font-medium transition-colors duration-150 ${
              tab === t.key
                ? 'text-[#020912] border-b-2 border-[#020912]'
                : 'text-[#020912]/40 hover:text-[#020912]/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onStatusFilterChange(f.key)}
            className={`px-3 py-1 text-xs font-medium transition-colors duration-150 ${
              statusFilter === f.key
                ? 'bg-[#020912] text-[#fcfcfc]'
                : 'border border-[rgba(2,9,18,0.15)] text-[#020912]/60 hover:text-[#020912] hover:border-[#020912]/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Skeleton loading state */}
      {showSkeleton && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonChatCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="text-center py-12">
          <p className="text-sm text-[#020912]/40">
            {EMPTY_MESSAGES[tab]}
          </p>
        </div>
      )}

      {/* Chat list */}
      {chats.length > 0 && (
        <div>
          {chats.map((chat) => (
            <CoffeeChatCard
              key={chat.id}
              chat={chat}
              onRespond={onRespond}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loading && chats.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#020912]/20 border-t-[#020912] rounded-full animate-spin" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="h-px" />
      )}
    </div>
  );
}
