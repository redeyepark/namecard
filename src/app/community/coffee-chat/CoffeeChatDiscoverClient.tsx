'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCoffeeChat } from '@/hooks/useCoffeeChat';
import MemberDiscoverGrid from '@/components/coffee-chat/MemberDiscoverGrid';
import CoffeeChatRequestModal from '@/components/coffee-chat/CoffeeChatRequestModal';
import type { DiscoverableMember, MeetingPreference } from '@/types/coffee-chat';

interface CoffeeChatDiscoverClientProps {
  isAuthenticated: boolean;
}

export function CoffeeChatDiscoverClient({
  isAuthenticated,
}: CoffeeChatDiscoverClientProps) {
  const {
    members,
    membersLoading,
    membersHasMore,
    membersSentinelRef,
    fetchMembers,
    createChat,
  } = useCoffeeChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalTarget, setModalTarget] = useState<DiscoverableMember | null>(null);

  // Initial load
  useEffect(() => {
    fetchMembers(true);
  }, [fetchMembers]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchMembers(true, query);
    },
    [fetchMembers]
  );

  const handleRequestClick = useCallback((member: DiscoverableMember) => {
    setModalTarget(member);
  }, []);

  const handleModalSubmit = useCallback(
    async (data: {
      receiverId: string;
      message: string;
      meetingPreference: MeetingPreference;
    }) => {
      await createChat(data);
      setModalTarget(null);
      // Refresh members to update hasPendingChat status
      fetchMembers(true, searchQuery);
    },
    [createChat, fetchMembers, searchQuery]
  );

  return (
    <div className="py-6">
      {/* Link to My Coffee Chats */}
      {isAuthenticated && (
        <div className="mb-4">
          <Link
            href="/community/coffee-chat/my"
            className="inline-flex items-center gap-1 text-sm text-primary/60 hover:text-primary transition-colors"
          >
            내 커피챗 보기
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
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Member Discover Grid */}
      <MemberDiscoverGrid
        members={members}
        hasMore={membersHasMore}
        sentinelRef={membersSentinelRef}
        loading={membersLoading}
        isAuthenticated={isAuthenticated}
        onRequestClick={handleRequestClick}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Request Modal */}
      {modalTarget && (
        <CoffeeChatRequestModal
          isOpen={!!modalTarget}
          onClose={() => setModalTarget(null)}
          targetUserId={modalTarget.id}
          targetDisplayName={modalTarget.displayName}
          targetAvatarUrl={modalTarget.avatarUrl}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
