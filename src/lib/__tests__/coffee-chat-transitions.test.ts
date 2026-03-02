import { describe, it, expect } from 'vitest';
import { VALID_TRANSITIONS } from '@/types/coffee-chat';
import type { CoffeeChatStatus } from '@/types/coffee-chat';

// ---------------------------------------------------------------------------
// Helper: inline transition validation function
// ---------------------------------------------------------------------------

function canTransition(
  currentStatus: CoffeeChatStatus,
  action: string,
  isRequester: boolean
): { valid: boolean; nextStatus?: CoffeeChatStatus } {
  const transitions = VALID_TRANSITIONS[currentStatus];
  const transition = transitions.find((t) => t.action === action);
  if (!transition) return { valid: false };

  const userRole = isRequester ? 'requester' : 'receiver';
  if (transition.allowedBy !== 'both' && transition.allowedBy !== userRole) {
    return { valid: false };
  }
  return { valid: true, nextStatus: transition.nextStatus };
}

// ---------------------------------------------------------------------------
// VALID_TRANSITIONS structure tests
// ---------------------------------------------------------------------------

describe('VALID_TRANSITIONS', () => {
  const ALL_STATUSES: CoffeeChatStatus[] = [
    'pending',
    'accepted',
    'declined',
    'cancelled',
    'completed',
  ];

  it('has all 5 statuses as keys', () => {
    const keys = Object.keys(VALID_TRANSITIONS);
    expect(keys).toHaveLength(5);
    for (const status of ALL_STATUSES) {
      expect(VALID_TRANSITIONS).toHaveProperty(status);
    }
  });

  it('pending allows 3 actions (accept, decline, cancel)', () => {
    expect(VALID_TRANSITIONS.pending).toHaveLength(3);
    const actions = VALID_TRANSITIONS.pending.map((t) => t.action);
    expect(actions).toContain('accept');
    expect(actions).toContain('decline');
    expect(actions).toContain('cancel');
  });

  it('accepted allows 1 action (complete)', () => {
    expect(VALID_TRANSITIONS.accepted).toHaveLength(1);
    expect(VALID_TRANSITIONS.accepted[0].action).toBe('complete');
  });

  it('declined allows 0 actions', () => {
    expect(VALID_TRANSITIONS.declined).toHaveLength(0);
  });

  it('cancelled allows 0 actions', () => {
    expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it('completed allows 0 actions', () => {
    expect(VALID_TRANSITIONS.completed).toHaveLength(0);
  });

  it('accept action is allowed by receiver only', () => {
    const acceptTransition = VALID_TRANSITIONS.pending.find(
      (t) => t.action === 'accept'
    );
    expect(acceptTransition?.allowedBy).toBe('receiver');
  });

  it('decline action is allowed by receiver only', () => {
    const declineTransition = VALID_TRANSITIONS.pending.find(
      (t) => t.action === 'decline'
    );
    expect(declineTransition?.allowedBy).toBe('receiver');
  });

  it('cancel action is allowed by requester only', () => {
    const cancelTransition = VALID_TRANSITIONS.pending.find(
      (t) => t.action === 'cancel'
    );
    expect(cancelTransition?.allowedBy).toBe('requester');
  });

  it('complete action is allowed by both', () => {
    const completeTransition = VALID_TRANSITIONS.accepted.find(
      (t) => t.action === 'complete'
    );
    expect(completeTransition?.allowedBy).toBe('both');
  });

  it('accept transitions from pending to accepted', () => {
    const t = VALID_TRANSITIONS.pending.find((tr) => tr.action === 'accept');
    expect(t?.nextStatus).toBe('accepted');
  });

  it('decline transitions from pending to declined', () => {
    const t = VALID_TRANSITIONS.pending.find((tr) => tr.action === 'decline');
    expect(t?.nextStatus).toBe('declined');
  });

  it('cancel transitions from pending to cancelled', () => {
    const t = VALID_TRANSITIONS.pending.find((tr) => tr.action === 'cancel');
    expect(t?.nextStatus).toBe('cancelled');
  });

  it('complete transitions from accepted to completed', () => {
    const t = VALID_TRANSITIONS.accepted.find(
      (tr) => tr.action === 'complete'
    );
    expect(t?.nextStatus).toBe('completed');
  });

  it('no action leads to a status not in the valid set', () => {
    for (const status of ALL_STATUSES) {
      for (const transition of VALID_TRANSITIONS[status]) {
        expect(ALL_STATUSES).toContain(transition.nextStatus);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// canTransition helper tests
// ---------------------------------------------------------------------------

describe('canTransition', () => {
  it('requester cannot accept a pending request', () => {
    const result = canTransition('pending', 'accept', true);
    expect(result.valid).toBe(false);
    expect(result.nextStatus).toBeUndefined();
  });

  it('receiver cannot cancel a pending request', () => {
    const result = canTransition('pending', 'cancel', false);
    expect(result.valid).toBe(false);
    expect(result.nextStatus).toBeUndefined();
  });

  it('requester can cancel a pending request', () => {
    const result = canTransition('pending', 'cancel', true);
    expect(result.valid).toBe(true);
    expect(result.nextStatus).toBe('cancelled');
  });

  it('receiver can accept a pending request', () => {
    const result = canTransition('pending', 'accept', false);
    expect(result.valid).toBe(true);
    expect(result.nextStatus).toBe('accepted');
  });

  it('either party can complete an accepted request', () => {
    const requesterResult = canTransition('accepted', 'complete', true);
    expect(requesterResult.valid).toBe(true);
    expect(requesterResult.nextStatus).toBe('completed');

    const receiverResult = canTransition('accepted', 'complete', false);
    expect(receiverResult.valid).toBe(true);
    expect(receiverResult.nextStatus).toBe('completed');
  });
});
