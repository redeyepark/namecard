// ---------------------------------------------------------------------------
// Coffee Chat Types (SPEC-COMMUNITY-004)
// ---------------------------------------------------------------------------

export type CoffeeChatStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
export type MeetingPreference = 'online' | 'offline' | 'any';

export interface CoffeeChat {
  id: string;
  requesterId: string;
  receiverId: string;
  message: string;
  responseMessage: string | null;
  meetingPreference: MeetingPreference;
  status: CoffeeChatStatus;
  requesterRead: boolean;
  receiverRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeChatUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string;
}

export interface CoffeeChatWithUsers extends CoffeeChat {
  requester: CoffeeChatUser;
  receiver: CoffeeChatUser;
  isRequester: boolean;
}

export interface DiscoverableMember {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  cardCount: number;
  hasPendingChat: boolean;
}

export interface CreateCoffeeChatRequest {
  receiverId: string;
  message: string;
  meetingPreference: MeetingPreference;
}

export interface RespondCoffeeChatRequest {
  action: 'accept' | 'decline' | 'cancel' | 'complete';
  responseMessage?: string;
}

export interface CoffeeChatListResponse {
  chats: CoffeeChatWithUsers[];
  cursor: string | null;
  hasMore: boolean;
}

export interface DiscoverableMembersResponse {
  members: DiscoverableMember[];
  cursor: string | null;
  hasMore: boolean;
}

// Valid state transitions
interface Transition {
  action: string;
  nextStatus: CoffeeChatStatus;
  allowedBy: 'requester' | 'receiver' | 'both';
}

export const VALID_TRANSITIONS: Record<CoffeeChatStatus, Transition[]> = {
  pending: [
    { action: 'accept', nextStatus: 'accepted', allowedBy: 'receiver' },
    { action: 'decline', nextStatus: 'declined', allowedBy: 'receiver' },
    { action: 'cancel', nextStatus: 'cancelled', allowedBy: 'requester' },
  ],
  accepted: [
    { action: 'complete', nextStatus: 'completed', allowedBy: 'both' },
  ],
  declined: [],
  cancelled: [],
  completed: [],
};

// Meeting preference labels (Korean)
export const MEETING_PREFERENCE_LABELS: Record<MeetingPreference, string> = {
  online: '온라인',
  offline: '오프라인',
  any: '상관없음',
};

// Status labels (Korean)
export const STATUS_LABELS: Record<CoffeeChatStatus, string> = {
  pending: '대기중',
  accepted: '수락됨',
  declined: '거절됨',
  cancelled: '취소됨',
  completed: '완료됨',
};
