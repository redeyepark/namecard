import type { CardData } from './card';

export type RequestStatus = 'submitted' | 'processing' | 'confirmed';

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string; // ISO 8601
}

export interface CardRequest {
  id: string; // UUID v4
  card: CardData; // Card data snapshot (avatarImage set to null)
  originalAvatarPath: string | null; // Avatar image file path
  illustrationPath: string | null; // Admin-uploaded illustration file path
  status: RequestStatus;
  submittedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  note?: string; // Optional user memo
  createdBy?: string; // User email from NextAuth session
  statusHistory: StatusHistoryEntry[];
}

export interface RequestSummary {
  id: string;
  displayName: string;
  status: RequestStatus;
  submittedAt: string;
  hasIllustration: boolean;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ['processing'],
  processing: ['confirmed'],
  confirmed: [],
};

export function isValidStatusTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
