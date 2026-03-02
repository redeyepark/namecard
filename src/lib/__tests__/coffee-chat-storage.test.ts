import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripHtml } from '../question-storage';

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock('../supabase', () => ({
  getSupabase: () => ({
    from: (table: string) => {
      const result = mockFrom(table);
      return result;
    },
    auth: { admin: { getUserById: vi.fn() } },
  }),
}));

// Import after mock setup
import {
  checkCoffeeChatRateLimit,
  checkExistingActiveChat,
} from '../coffee-chat-storage';

// ---------------------------------------------------------------------------
// checkCoffeeChatRateLimit tests
// ---------------------------------------------------------------------------

describe('checkCoffeeChatRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when count >= 5 (rate limited)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 5 }),
        }),
      }),
    });

    const result = await checkCoffeeChatRateLimit('user-123');
    expect(result).toBe(true);
  });

  it('returns false when count < 5', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 4 }),
        }),
      }),
    });

    const result = await checkCoffeeChatRateLimit('user-123');
    expect(result).toBe(false);
  });

  it('returns false when count is 0', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
    });

    const result = await checkCoffeeChatRateLimit('user-123');
    expect(result).toBe(false);
  });

  it('returns false when count is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: null }),
        }),
      }),
    });

    const result = await checkCoffeeChatRateLimit('user-123');
    expect(result).toBe(false);
  });

  it('queries coffee_chat_requests table', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
    });

    await checkCoffeeChatRateLimit('user-123');
    expect(mockFrom).toHaveBeenCalledWith('coffee_chat_requests');
  });

  it('uses select with head: true and count: exact', async () => {
    const mockGte = vi.fn().mockResolvedValue({ count: 0 });
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockFrom.mockReturnValue({ select: mockSelect });

    await checkCoffeeChatRateLimit('user-123');
    expect(mockSelect).toHaveBeenCalledWith('id', {
      count: 'exact',
      head: true,
    });
  });
});

// ---------------------------------------------------------------------------
// checkExistingActiveChat tests
// ---------------------------------------------------------------------------

describe('checkExistingActiveChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns exists: true when active chat found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { id: 'chat-1' }, error: null }),
            }),
          }),
        }),
      }),
    });

    const result = await checkExistingActiveChat('user-a', 'user-b');
    expect(result.exists).toBe(true);
  });

  it('returns exists: false when no active chat found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });

    const result = await checkExistingActiveChat('user-a', 'user-b');
    expect(result.exists).toBe(false);
  });

  it('returns the chatId when exists', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'chat-abc-123' },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const result = await checkExistingActiveChat('user-a', 'user-b');
    expect(result.chatId).toBe('chat-abc-123');
  });

  it('returns an object where exists=false is falsy when accessed via .exists (regression)', async () => {
    // Regression test: checkExistingActiveChat always returns an object { exists: boolean }.
    // The route handler must check `result.exists`, NOT just `if (result)` (objects are always truthy).
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });

    const result = await checkExistingActiveChat('user-a', 'user-b');
    // The object itself is truthy (it's an object)
    expect(result).toBeTruthy();
    // But .exists must be false - this is what the route handler should check
    expect(result.exists).toBe(false);
  });

  it('checks both directions (A->B and B->A)', async () => {
    const mockOr = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ or: mockOr }),
    });

    await checkExistingActiveChat('user-a', 'user-b');

    // The or clause should contain both directions
    const orArg = mockOr.mock.calls[0][0] as string;
    expect(orArg).toContain('user-a');
    expect(orArg).toContain('user-b');
    expect(orArg).toContain('requester_id');
    expect(orArg).toContain('receiver_id');
  });
});

// ---------------------------------------------------------------------------
// HTML stripping for coffee chat messages (reuse stripHtml)
// ---------------------------------------------------------------------------

describe('stripHtml for coffee chat messages', () => {
  it('strips HTML from coffee chat message', () => {
    expect(stripHtml('<p>Let us <b>meet</b> for coffee!</p>')).toBe(
      'Let us meet for coffee!'
    );
  });

  it('trims whitespace', () => {
    expect(stripHtml('  hello world  ')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});
