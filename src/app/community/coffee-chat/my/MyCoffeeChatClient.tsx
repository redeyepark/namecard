'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCoffeeChat, type ChatStatusFilter } from '@/hooks/useCoffeeChat';
import CoffeeChatList from '@/components/coffee-chat/CoffeeChatList';

type TabType = 'received' | 'sent';

export function MyCoffeeChatClient() {
  const { chats, loading, hasMore, sentinelRef, fetchChats, respondToChat } =
    useCoffeeChat();

  const [tab, setTab] = useState<TabType>('received');
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilter>('all');

  // Fetch on mount and tab/status change
  useEffect(() => {
    fetchChats(tab, statusFilter, true);
  }, [tab, statusFilter, fetchChats]);

  const handleTabChange = useCallback(
    (newTab: TabType) => {
      setTab(newTab);
      setStatusFilter('all');
    },
    []
  );

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status as ChatStatusFilter);
  }, []);

  const handleRespond = useCallback(
    async (chatId: string, action: string, responseMessage?: string) => {
      await respondToChat(chatId, action as 'accept' | 'decline' | 'cancel' | 'complete', responseMessage);
    },
    [respondToChat]
  );

  return (
    <>
      {/* Header */}
      <header className="bg-[#020912] text-[#fcfcfc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            href="/community/coffee-chat"
            className="inline-flex items-center gap-1 text-xs text-[#fcfcfc]/50 hover:text-[#fcfcfc]/80 transition-colors mb-3"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            뒤로
          </Link>
          <h1 className="font-[family-name:var(--font-figtree),sans-serif] text-xl sm:text-2xl font-bold tracking-tight">
            내 커피챗
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <CoffeeChatList
          chats={chats}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
          loading={loading}
          tab={tab}
          onTabChange={handleTabChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onRespond={handleRespond}
        />
      </main>
    </>
  );
}
