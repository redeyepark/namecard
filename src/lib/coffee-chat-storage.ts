import { getSupabase } from './supabase';
import { stripHtml } from './question-storage';
import type {
  CoffeeChatWithUsers,
  CoffeeChatStatus,
  MeetingPreference,
  DiscoverableMember,
} from '@/types/coffee-chat';
import { VALID_TRANSITIONS } from '@/types/coffee-chat';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Batch-fetch user profiles by their IDs.
 * Returns a map from userId to { id, displayName, avatarUrl }.
 */
async function fetchUserProfiles(
  userIds: string[]
): Promise<Map<string, { id: string; displayName: string; avatarUrl: string | null }>> {
  const profileMap = new Map<
    string,
    { id: string; displayName: string; avatarUrl: string | null }
  >();
  if (userIds.length === 0) return profileMap;

  const supabase = getSupabase();
  const uniqueIds = [...new Set(userIds)];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_url')
    .in('id', uniqueIds);

  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id as string, {
        id: p.id as string,
        displayName: (p.display_name as string) ?? 'Anonymous',
        avatarUrl: (p.avatar_url as string) || null,
      });
    }
  }

  return profileMap;
}

/**
 * Get a user profile from the map, with fallback to 'Anonymous'.
 */
function getUserFromMap(
  profileMap: Map<string, { id: string; displayName: string; avatarUrl: string | null }>,
  userId: string
): { id: string; displayName: string; avatarUrl: string | null } {
  return profileMap.get(userId) || { id: userId, displayName: 'Anonymous', avatarUrl: null };
}

/**
 * Map a snake_case coffee_chat_requests DB row to a CoffeeChatWithUsers object.
 */
function mapChatRow(
  row: Record<string, unknown>,
  requester: { id: string; displayName: string; avatarUrl: string | null; email?: string },
  receiver: { id: string; displayName: string; avatarUrl: string | null; email?: string },
  isRequester: boolean
): CoffeeChatWithUsers {
  return {
    id: row.id as string,
    requesterId: row.requester_id as string,
    receiverId: row.receiver_id as string,
    message: row.message as string,
    responseMessage: (row.response_message as string) || null,
    meetingPreference: row.meeting_preference as MeetingPreference,
    status: row.status as CoffeeChatStatus,
    requesterRead: row.requester_read as boolean,
    receiverRead: row.receiver_read as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    requester,
    receiver,
    isRequester,
  };
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

/**
 * Check if user is rate limited for creating coffee chat requests.
 * Limit: max 5 requests per 24 hours.
 * @returns true if rate limited (should NOT proceed)
 */
export async function checkCoffeeChatRateLimit(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('coffee_chat_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .gte('created_at', twentyFourHoursAgo);

  return count !== null && count >= 5;
}

// ---------------------------------------------------------------------------
// Existing Chat Check
// ---------------------------------------------------------------------------

/**
 * Check if there is already an active (pending or accepted) coffee chat
 * between two users in either direction.
 */
export async function checkExistingActiveChat(
  userId: string,
  targetId: string
): Promise<{ exists: boolean; chatId?: string }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('coffee_chat_requests')
    .select('id')
    .or(
      `and(requester_id.eq.${userId},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${userId})`
    )
    .in('status', ['pending', 'accepted'])
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { exists: false };
  }

  return { exists: true, chatId: data.id as string };
}

// ---------------------------------------------------------------------------
// Coffee Chat List
// ---------------------------------------------------------------------------

/**
 * Get coffee chats for a user with cursor-based pagination.
 *
 * - tab='received': chats where the user is the receiver
 * - tab='sent': chats where the user is the requester
 * - status filter: 'all' shows all statuses, otherwise filters by specific status
 * - Cursor: ISO timestamp (created_at), ordered DESC
 *
 * Fetches limit+1 rows to determine hasMore.
 * When tab='received', marks unread chats as read.
 */
export async function getCoffeeChats(
  userId: string,
  tab: 'received' | 'sent',
  status: string,
  cursor: string | null | undefined,
  limit: number
): Promise<{ chats: CoffeeChatWithUsers[]; cursor: string | null; hasMore: boolean }> {
  const supabase = getSupabase();
  const fetchCount = limit + 1;

  let query = supabase.from('coffee_chat_requests').select('*');

  // Tab filter
  if (tab === 'received') {
    query = query.eq('receiver_id', userId);
  } else {
    query = query.eq('requester_id', userId);
  }

  // Status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  query = query.order('created_at', { ascending: false }).limit(fetchCount);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { chats: [], cursor: null, hasMore: false };
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Batch-fetch profiles for all requester and receiver IDs
  const allUserIds = items.flatMap((r) => [r.requester_id as string, r.receiver_id as string]);
  const profileMap = await fetchUserProfiles(allUserIds);

  const chats: CoffeeChatWithUsers[] = items.map((row) => {
    const requester = getUserFromMap(profileMap, row.requester_id as string);
    const receiver = getUserFromMap(profileMap, row.receiver_id as string);
    const isRequester = row.requester_id === userId;
    return mapChatRow(row, requester, receiver, isRequester);
  });

  // When tab is 'received', mark unread chats as read
  if (tab === 'received') {
    const unreadIds = items
      .filter((r) => !(r.receiver_read as boolean))
      .map((r) => r.id as string);

    if (unreadIds.length > 0) {
      await supabase
        .from('coffee_chat_requests')
        .update({ receiver_read: true })
        .in('id', unreadIds);
    }
  }

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = lastItem.created_at as string;
  }

  return { chats, cursor: nextCursor, hasMore };
}

// ---------------------------------------------------------------------------
// Coffee Chat Detail
// ---------------------------------------------------------------------------

/**
 * Get a single coffee chat by ID with user profiles.
 * Verifies the requesting user is either the requester or receiver.
 * If status is 'accepted', also fetches user emails via admin API.
 * Marks the chat as read for the current user.
 */
export async function getCoffeeChatById(
  chatId: string,
  userId: string
): Promise<CoffeeChatWithUsers | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('coffee_chat_requests')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error || !row) {
    return null;
  }

  // Verify user is involved in this chat
  const isRequester = row.requester_id === userId;
  const isReceiver = row.receiver_id === userId;

  if (!isRequester && !isReceiver) {
    return null;
  }

  // Fetch profiles for both users
  const profileMap = await fetchUserProfiles([
    row.requester_id as string,
    row.receiver_id as string,
  ]);

  const requester: { id: string; displayName: string; avatarUrl: string | null; email?: string } =
    { ...getUserFromMap(profileMap, row.requester_id as string) };
  const receiver: { id: string; displayName: string; avatarUrl: string | null; email?: string } =
    { ...getUserFromMap(profileMap, row.receiver_id as string) };

  // If status is 'accepted', fetch emails via admin API
  if (row.status === 'accepted') {
    const [requesterAuth, receiverAuth] = await Promise.all([
      supabase.auth.admin.getUserById(row.requester_id as string),
      supabase.auth.admin.getUserById(row.receiver_id as string),
    ]);

    if (requesterAuth.data?.user?.email) {
      requester.email = requesterAuth.data.user.email;
    }
    if (receiverAuth.data?.user?.email) {
      receiver.email = receiverAuth.data.user.email;
    }
  }

  // Mark as read for the current user
  if (isRequester && !(row.requester_read as boolean)) {
    await supabase
      .from('coffee_chat_requests')
      .update({ requester_read: true })
      .eq('id', chatId);
  } else if (isReceiver && !(row.receiver_read as boolean)) {
    await supabase
      .from('coffee_chat_requests')
      .update({ receiver_read: true })
      .eq('id', chatId);
  }

  return mapChatRow(row, requester, receiver, isRequester);
}

// ---------------------------------------------------------------------------
// Create Coffee Chat
// ---------------------------------------------------------------------------

/**
 * Create a new coffee chat request.
 * Strips HTML from message and validates length (20-500 chars after stripping).
 */
export async function createCoffeeChat(
  requesterId: string,
  receiverId: string,
  message: string,
  meetingPreference: MeetingPreference
): Promise<CoffeeChatWithUsers> {
  const supabase = getSupabase();

  // Sanitize message
  const cleanMessage = stripHtml(message);
  if (cleanMessage.length < 20) {
    throw new Error('Message must be at least 20 characters after sanitization');
  }
  if (cleanMessage.length > 500) {
    throw new Error('Message must be at most 500 characters after sanitization');
  }

  const { data: row, error } = await supabase
    .from('coffee_chat_requests')
    .insert({
      requester_id: requesterId,
      receiver_id: receiverId,
      message: cleanMessage,
      meeting_preference: meetingPreference,
      status: 'pending',
      requester_read: true,
      receiver_read: false,
    })
    .select('*')
    .single();

  if (error || !row) {
    throw new Error(`Failed to create coffee chat: ${error?.message || 'Unknown error'}`);
  }

  // Fetch profiles
  const profileMap = await fetchUserProfiles([requesterId, receiverId]);
  const requester = getUserFromMap(profileMap, requesterId);
  const receiver = getUserFromMap(profileMap, receiverId);

  return mapChatRow(row, requester, receiver, true);
}

// ---------------------------------------------------------------------------
// Respond to Coffee Chat
// ---------------------------------------------------------------------------

/**
 * Respond to a coffee chat request (accept, decline, cancel, complete).
 * Validates the user is allowed to perform the action based on VALID_TRANSITIONS.
 */
export async function respondToCoffeeChat(
  chatId: string,
  userId: string,
  action: string,
  responseMessage?: string
): Promise<CoffeeChatWithUsers> {
  const supabase = getSupabase();

  // Fetch the chat
  const { data: row, error: fetchError } = await supabase
    .from('coffee_chat_requests')
    .select('*')
    .eq('id', chatId)
    .single();

  if (fetchError || !row) {
    throw new Error('Coffee chat not found');
  }

  // Validate user is involved
  const isRequester = row.requester_id === userId;
  const isReceiver = row.receiver_id === userId;

  if (!isRequester && !isReceiver) {
    throw new Error('Not authorized to respond to this coffee chat');
  }

  // Look up valid transition
  const currentStatus = row.status as CoffeeChatStatus;
  const transitions = VALID_TRANSITIONS[currentStatus];
  const transition = transitions.find((t) => t.action === action);

  if (!transition) {
    throw new Error(`Invalid action '${action}' for status '${currentStatus}'`);
  }

  // Validate allowedBy
  const role = isRequester ? 'requester' : 'receiver';
  if (transition.allowedBy !== 'both' && transition.allowedBy !== role) {
    throw new Error(`Action '${action}' is not allowed for ${role}`);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    status: transition.nextStatus,
    updated_at: new Date().toISOString(),
  };

  // If accepting and responseMessage provided, strip HTML and set it
  if (action === 'accept' && responseMessage) {
    updateData.response_message = stripHtml(responseMessage);
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('coffee_chat_requests')
    .update(updateData)
    .eq('id', chatId)
    .select('*')
    .single();

  if (updateError || !updatedRow) {
    throw new Error(`Failed to update coffee chat: ${updateError?.message || 'Unknown error'}`);
  }

  // Fetch profiles
  const profileMap = await fetchUserProfiles([
    updatedRow.requester_id as string,
    updatedRow.receiver_id as string,
  ]);
  const requester = getUserFromMap(profileMap, updatedRow.requester_id as string);
  const receiver = getUserFromMap(profileMap, updatedRow.receiver_id as string);

  return mapChatRow(updatedRow, requester, receiver, isRequester);
}

// ---------------------------------------------------------------------------
// Pending Received Count
// ---------------------------------------------------------------------------

/**
 * Get the count of pending, unread coffee chat requests received by a user.
 * Used for notification badges.
 */
export async function getPendingReceivedCount(userId: string): Promise<number> {
  const supabase = getSupabase();

  const { count } = await supabase
    .from('coffee_chat_requests')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .eq('receiver_read', false);

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Discoverable Members
// ---------------------------------------------------------------------------

/**
 * Get discoverable members (public profiles) with cursor-based pagination.
 * Includes card count and whether the current user has a pending/accepted chat.
 */
export async function getDiscoverableMembers(
  currentUserId: string | null,
  cursor: string | null | undefined,
  limit: number,
  search?: string
): Promise<{ members: DiscoverableMember[]; cursor: string | null; hasMore: boolean }> {
  const supabase = getSupabase();
  const fetchCount = limit + 1;

  let query = supabase
    .from('user_profiles')
    .select('id, display_name, bio, avatar_url, created_at')
    .eq('is_public', true);

  // Search filter
  if (search) {
    query = query.ilike('display_name', `%${search}%`);
  }

  // Exclude current user
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  query = query.order('created_at', { ascending: false }).limit(fetchCount);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { members: [], cursor: null, hasMore: false };
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  if (items.length === 0) {
    return { members: [], cursor: null, hasMore: false };
  }

  const memberIds = items.map((r) => r.id as string);

  // Batch-fetch card counts for all members
  const { data: cardRows } = await supabase
    .from('cards')
    .select('user_id')
    .in('user_id', memberIds);

  const cardCountMap = new Map<string, number>();
  if (cardRows) {
    for (const cr of cardRows) {
      const uid = cr.user_id as string;
      cardCountMap.set(uid, (cardCountMap.get(uid) || 0) + 1);
    }
  }

  // Batch-check existing active chats if user is logged in
  const activeChatSet = new Set<string>();
  if (currentUserId) {
    const { data: activeChats } = await supabase
      .from('coffee_chat_requests')
      .select('requester_id, receiver_id')
      .or(
        `requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
      )
      .in('status', ['pending', 'accepted']);

    if (activeChats) {
      for (const chat of activeChats) {
        // The other party is whoever is not the current user
        const otherId =
          (chat.requester_id as string) === currentUserId
            ? (chat.receiver_id as string)
            : (chat.requester_id as string);
        activeChatSet.add(otherId);
      }
    }
  }

  const members: DiscoverableMember[] = items.map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string) ?? 'Anonymous',
    bio: (row.bio as string) || '',
    avatarUrl: (row.avatar_url as string) || null,
    cardCount: cardCountMap.get(row.id as string) || 0,
    hasPendingChat: activeChatSet.has(row.id as string),
  }));

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = lastItem.created_at as string;
  }

  return { members, cursor: nextCursor, hasMore };
}
