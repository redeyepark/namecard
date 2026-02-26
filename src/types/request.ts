import type { CardData } from './card';

export type RequestStatus =
  | 'submitted'
  | 'processing'
  | 'revision_requested'
  | 'confirmed'
  | 'rejected'
  | 'delivered'
  | 'cancelled';

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string; // ISO 8601
  adminFeedback?: string;
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
  isPublic: boolean; // Public visibility toggle (default: false)
  eventId?: string; // Associated event ID (optional)
  statusHistory: StatusHistoryEntry[];
}

export interface RequestSummary {
  id: string;
  displayName: string;
  status: RequestStatus;
  submittedAt: string;
  hasIllustration: boolean;
  originalAvatarUrl?: string | null;
  eventId?: string | null;
  eventName?: string | null;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ['processing', 'rejected', 'cancelled', 'confirmed'],
  processing: ['confirmed', 'revision_requested'],
  revision_requested: ['submitted', 'cancelled'],
  confirmed: ['delivered'],
  rejected: [],
  delivered: [],
  cancelled: [],
};

export function isValidStatusTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Returns true if the request can be edited by the user.
 * Only 'submitted' and 'revision_requested' statuses allow edits.
 */
export function isEditableStatus(status: RequestStatus): boolean {
  return status === 'submitted' || status === 'revision_requested' || status === 'processing';
}

/**
 * Returns true if the request can be cancelled by the user.
 * Only 'submitted' and 'revision_requested' statuses allow cancellation.
 */
export function isCancellableStatus(status: RequestStatus): boolean {
  return status === 'submitted' || status === 'revision_requested';
}

/**
 * Returns true if the status is a terminal state (no further transitions).
 */
export function isTerminalStatus(status: RequestStatus): boolean {
  return status === 'rejected' || status === 'delivered' || status === 'cancelled';
}

/**
 * Returns true if the admin can edit card content (displayName, fullName, title,
 * hashtags, socialLinks, backgroundColor, textColor) before delivery.
 * Editable in all non-terminal statuses: submitted, processing, revision_requested, confirmed.
 */
export function isAdminEditableStatus(status: RequestStatus): boolean {
  return !isTerminalStatus(status);
}

/**
 * Returns true if the status transition requires admin feedback text.
 * 'revision_requested' and 'rejected' require an explanation.
 */
export function requiresFeedback(status: RequestStatus): boolean {
  return status === 'revision_requested' || status === 'rejected';
}
