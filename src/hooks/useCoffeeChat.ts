'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type {
  CoffeeChatWithUsers,
  CoffeeChatListResponse,
  CreateCoffeeChatRequest,
  RespondCoffeeChatRequest,
  DiscoverableMember,
  DiscoverableMembersResponse,
} from '@/types/coffee-chat';

export type ChatTab = 'sent' | 'received';
export type ChatStatusFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export function useCoffeeChat() {
  // Chat list state
  const [chats, setChats] = useState<CoffeeChatWithUsers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const tabRef = useRef<ChatTab>('received');
  const statusRef = useRef<ChatStatusFilter>('all');

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Members state
  const [members, setMembers] = useState<DiscoverableMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersHasMore, setMembersHasMore] = useState(true);
  const membersCursorRef = useRef<string | null>(null);
  const membersSearchRef = useRef<string | undefined>(undefined);

  const { ref: membersSentinelRef, inView: membersInView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // -------------------------------------------------------------------------
  // Chat list operations
  // -------------------------------------------------------------------------

  const fetchChats = useCallback(
    async (tab: ChatTab, status: ChatStatusFilter, reset?: boolean) => {
      setLoading(true);
      setError(null);

      // Store params for subsequent pagination fetches
      tabRef.current = tab;
      statusRef.current = status;

      if (reset) {
        cursorRef.current = null;
      }

      try {
        const params = new URLSearchParams();
        params.set('tab', tab);
        if (status !== 'all') params.set('status', status);
        if (cursorRef.current) params.set('cursor', cursorRef.current);
        params.set('limit', '20');

        const res = await fetch(`/api/coffee-chat?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch coffee chats');

        const data: CoffeeChatListResponse = await res.json();

        if (reset) {
          setChats(data.chats);
        } else {
          setChats((prev) => [...prev, ...data.chats]);
        }
        cursorRef.current = data.cursor;
        setHasMore(data.hasMore);
      } catch {
        setError('커피챗 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load more chats when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !loading && cursorRef.current) {
      fetchChats(tabRef.current, statusRef.current);
    }
  }, [inView, hasMore, loading, fetchChats]);

  // Create a new coffee chat request
  const createChat = useCallback(
    async (data: CreateCoffeeChatRequest): Promise<CoffeeChatWithUsers> => {
      const res = await fetch('/api/coffee-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '커피챗 요청에 실패했습니다.');
      }

      const newChat: CoffeeChatWithUsers = await res.json();
      setChats((prev) => [newChat, ...prev]);
      return newChat;
    },
    []
  );

  // Respond to a coffee chat (accept / decline / cancel / complete)
  const respondToChat = useCallback(
    async (
      chatId: string,
      action: RespondCoffeeChatRequest['action'],
      responseMessage?: string
    ): Promise<CoffeeChatWithUsers> => {
      const res = await fetch(`/api/coffee-chat/${chatId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, responseMessage }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '커피챗 응답에 실패했습니다.');
      }

      const updated: CoffeeChatWithUsers = await res.json();
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? updated : c))
      );
      return updated;
    },
    []
  );

  // Get a single coffee chat detail
  const getChatDetail = useCallback(
    async (chatId: string): Promise<CoffeeChatWithUsers> => {
      const res = await fetch(`/api/coffee-chat/${chatId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '커피챗 상세 조회에 실패했습니다.');
      }
      return res.json();
    },
    []
  );

  // -------------------------------------------------------------------------
  // Discoverable members operations
  // -------------------------------------------------------------------------

  const fetchMembers = useCallback(
    async (reset?: boolean, search?: string) => {
      setMembersLoading(true);

      if (reset) {
        membersCursorRef.current = null;
      }
      if (search !== undefined) {
        membersSearchRef.current = search;
      }

      try {
        const params = new URLSearchParams();
        if (membersCursorRef.current) params.set('cursor', membersCursorRef.current);
        params.set('limit', '20');
        if (membersSearchRef.current) params.set('search', membersSearchRef.current);

        const res = await fetch(`/api/members/discoverable?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch members');

        const data: DiscoverableMembersResponse = await res.json();

        if (reset) {
          setMembers(data.members);
        } else {
          setMembers((prev) => [...prev, ...data.members]);
        }
        membersCursorRef.current = data.cursor;
        setMembersHasMore(data.hasMore);
      } catch {
        // Silent fail for members – primary content is chat list
      } finally {
        setMembersLoading(false);
      }
    },
    []
  );

  // Load more members when sentinel is in view
  useEffect(() => {
    if (membersInView && membersHasMore && !membersLoading && membersCursorRef.current) {
      fetchMembers();
    }
  }, [membersInView, membersHasMore, membersLoading, fetchMembers]);

  // Reset members list (useful when switching views)
  const resetMembers = useCallback(() => {
    setMembers([]);
    membersCursorRef.current = null;
    membersSearchRef.current = undefined;
    setMembersHasMore(true);
  }, []);

  return {
    // Chat list
    chats,
    loading,
    error,
    hasMore,
    sentinelRef,
    fetchChats,
    createChat,
    respondToChat,
    getChatDetail,
    // Members
    members,
    membersLoading,
    membersHasMore,
    membersSentinelRef,
    fetchMembers,
    resetMembers,
  };
}
