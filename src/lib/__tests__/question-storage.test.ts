import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripHtml, checkQuestionRateLimit, checkThoughtRateLimit, checkLikeRateLimit } from '../question-storage';

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockIn = vi.fn();
const mockFrom = vi.fn();

function createChainableMock(resolvedValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  // Final call resolves the promise-like value
  Object.assign(chain, resolvedValue);
  // Make it thenable so await works on the chain itself
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => Promise.resolve(resolvedValue).then(resolve);
  return chain;
}

vi.mock('../supabase', () => ({
  getSupabase: () => ({
    from: (table: string) => {
      const result = mockFrom(table);
      return result;
    },
  }),
}));

// ---------------------------------------------------------------------------
// stripHtml tests
// ---------------------------------------------------------------------------

describe('stripHtml', () => {
  it('removes HTML tags correctly', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('preserves normal text without tags', () => {
    expect(stripHtml('Hello World')).toBe('Hello World');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><span><strong>Deep</strong></span></div>')).toBe('Deep');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>Safe text')).toBe('alert("xss")Safe text');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtml('  <p>  hello  </p>  ')).toBe('hello');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Line1<br/>Line2')).toBe('Line1Line2');
  });

  it('handles tags with attributes', () => {
    expect(stripHtml('<a href="https://example.com" class="link">Click</a>')).toBe('Click');
  });
});

// ---------------------------------------------------------------------------
// Hashtag cleaning logic (tested via createQuestion behavior description)
// ---------------------------------------------------------------------------

describe('hashtag cleaning logic', () => {
  // These tests verify the hashtag cleaning algorithm as described in createQuestion:
  // lowercase, remove # prefix, deduplicate, max 5, max 20 chars

  function cleanHashtags(hashtags: string[]): string[] {
    // Replicate the exact logic from createQuestion
    const seen = new Set<string>();
    const cleanHashtags: string[] = [];
    for (const tag of hashtags) {
      const cleaned = stripHtml(tag)
        .toLowerCase()
        .replace(/^#/, '')
        .trim();
      if (cleaned && cleaned.length <= 20 && !seen.has(cleaned)) {
        seen.add(cleaned);
        cleanHashtags.push(cleaned);
        if (cleanHashtags.length >= 5) break;
      }
    }
    return cleanHashtags;
  }

  it('converts hashtags to lowercase', () => {
    expect(cleanHashtags(['React', 'JAVASCRIPT'])).toEqual(['react', 'javascript']);
  });

  it('removes # prefix from hashtags', () => {
    expect(cleanHashtags(['#react', '#vue'])).toEqual(['react', 'vue']);
  });

  it('deduplicates hashtags (case-insensitive)', () => {
    expect(cleanHashtags(['React', 'react', 'REACT'])).toEqual(['react']);
  });

  it('limits to maximum 5 hashtags', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const result = cleanHashtags(input);
    expect(result).toHaveLength(5);
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('filters out hashtags longer than 20 characters', () => {
    const longTag = 'a'.repeat(21);
    const shortTag = 'short';
    expect(cleanHashtags([longTag, shortTag])).toEqual(['short']);
  });

  it('accepts hashtags exactly 20 characters long', () => {
    const exactTag = 'a'.repeat(20);
    expect(cleanHashtags([exactTag])).toEqual([exactTag]);
  });

  it('strips HTML from hashtags', () => {
    expect(cleanHashtags(['<b>react</b>', '<i>vue</i>'])).toEqual(['react', 'vue']);
  });

  it('filters out empty hashtags', () => {
    expect(cleanHashtags(['', '  ', 'valid'])).toEqual(['valid']);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting tests with mocked Supabase
// ---------------------------------------------------------------------------

describe('checkQuestionRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true (rate limited) when user has posted within 60 seconds', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 1 }),
        }),
      }),
    });

    const result = await checkQuestionRateLimit('user-123');
    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('community_questions');
  });

  it('returns false (not rate limited) when user has not posted recently', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
    });

    const result = await checkQuestionRateLimit('user-123');
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

    const result = await checkQuestionRateLimit('user-123');
    expect(result).toBe(false);
  });
});

describe('checkThoughtRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true (rate limited) when user has posted a thought within 30 seconds', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: 1 }),
          }),
        }),
      }),
    });

    const result = await checkThoughtRateLimit('user-123', 'question-456');
    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('community_thoughts');
  });

  it('returns false (not rate limited) when user has not posted recently', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: 0 }),
          }),
        }),
      }),
    });

    const result = await checkThoughtRateLimit('user-123', 'question-456');
    expect(result).toBe(false);
  });
});

describe('checkLikeRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true (rate limited) when user has 100+ likes in the past hour', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 100 }),
        }),
      }),
    });

    const result = await checkLikeRateLimit('user-123');
    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('thought_likes');
  });

  it('returns false (not rate limited) when user has fewer than 100 likes', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 99 }),
        }),
      }),
    });

    const result = await checkLikeRateLimit('user-123');
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

    const result = await checkLikeRateLimit('user-123');
    expect(result).toBe(false);
  });
});
