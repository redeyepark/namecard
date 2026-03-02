import { describe, it, expect } from 'vitest';
import type { CoffeeChatStatus } from '@/types/coffee-chat';

// ---------------------------------------------------------------------------
// Helper: email visibility rule (replicates server-side logic from
// getCoffeeChatById in coffee-chat-storage.ts)
// ---------------------------------------------------------------------------

function shouldIncludeEmail(status: CoffeeChatStatus): boolean {
  return status === 'accepted';
}

// ---------------------------------------------------------------------------
// Email visibility tests
// ---------------------------------------------------------------------------

describe('shouldIncludeEmail', () => {
  it('accepted status -> includes email (true)', () => {
    expect(shouldIncludeEmail('accepted')).toBe(true);
  });

  it('pending status -> excludes email (false)', () => {
    expect(shouldIncludeEmail('pending')).toBe(false);
  });

  it('declined status -> excludes email (false)', () => {
    expect(shouldIncludeEmail('declined')).toBe(false);
  });

  it('cancelled status -> excludes email (false)', () => {
    expect(shouldIncludeEmail('cancelled')).toBe(false);
  });

  it('completed status -> excludes email (false)', () => {
    expect(shouldIncludeEmail('completed')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Email field presence based on status
// ---------------------------------------------------------------------------

describe('email field behavior based on status', () => {
  // Simulate the server-side pattern: emails are only attached when accepted
  function buildUserWithEmail(
    status: CoffeeChatStatus,
    email: string
  ): { id: string; displayName: string; avatarUrl: string | null; email?: string } {
    const user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      email?: string;
    } = {
      id: 'user-1',
      displayName: 'Test User',
      avatarUrl: null,
    };

    if (shouldIncludeEmail(status)) {
      user.email = email;
    }

    return user;
  }

  it('email fields should be undefined when not accepted', () => {
    const user = buildUserWithEmail('pending', 'test@example.com');
    expect(user.email).toBeUndefined();
  });

  it('email fields should be strings when accepted', () => {
    const user = buildUserWithEmail('accepted', 'test@example.com');
    expect(typeof user.email).toBe('string');
    expect(user.email).toBe('test@example.com');
  });

  it('both requester and receiver emails visible when accepted', () => {
    const requester = buildUserWithEmail('accepted', 'requester@example.com');
    const receiver = buildUserWithEmail('accepted', 'receiver@example.com');
    expect(requester.email).toBe('requester@example.com');
    expect(receiver.email).toBe('receiver@example.com');
  });

  it('neither email visible when pending', () => {
    const requester = buildUserWithEmail('pending', 'requester@example.com');
    const receiver = buildUserWithEmail('pending', 'receiver@example.com');
    expect(requester.email).toBeUndefined();
    expect(receiver.email).toBeUndefined();
  });

  it('email hidden after completion', () => {
    const user = buildUserWithEmail('completed', 'test@example.com');
    expect(user.email).toBeUndefined();
  });
});
