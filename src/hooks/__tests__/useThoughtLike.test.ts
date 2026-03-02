import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useThoughtLike } from '../useThoughtLike';

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useThoughtLike', () => {
  it('initial state reflects passed props (not liked)', () => {
    const { result } = renderHook(() => useThoughtLike('thought-1', false, 5));

    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(5);
    expect(result.current.isLoading).toBe(false);
  });

  it('initial state reflects passed props (already liked)', () => {
    const { result } = renderHook(() => useThoughtLike('thought-1', true, 10));

    expect(result.current.liked).toBe(true);
    expect(result.current.count).toBe(10);
    expect(result.current.isLoading).toBe(false);
  });

  it('toggle optimistically updates liked state from false to true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 6 }),
    });

    const { result } = renderHook(() => useThoughtLike('thought-1', false, 5));

    await act(async () => {
      result.current.toggle();
    });

    // After API resolves, state should sync with server response
    expect(result.current.liked).toBe(true);
    expect(result.current.count).toBe(6);
  });

  it('toggle optimistically updates count (increment when liking)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 11 }),
    });

    const { result } = renderHook(() => useThoughtLike('thought-1', false, 10));

    await act(async () => {
      result.current.toggle();
    });

    expect(result.current.count).toBe(11);
  });

  it('toggle optimistically updates count (decrement when unliking)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: false, likeCount: 9 }),
    });

    const { result } = renderHook(() => useThoughtLike('thought-1', true, 10));

    await act(async () => {
      result.current.toggle();
    });

    expect(result.current.count).toBe(9);
  });

  it('successful API response syncs state with server values', async () => {
    // Server returns different count than optimistic prediction
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 42 }),
    });

    const { result } = renderHook(() => useThoughtLike('thought-1', false, 5));

    await act(async () => {
      result.current.toggle();
    });

    // State should match server response, not optimistic value
    expect(result.current.liked).toBe(true);
    expect(result.current.count).toBe(42);
  });

  it('failed API response (non-ok) rolls back state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useThoughtLike('thought-1', false, 5));

    await act(async () => {
      result.current.toggle();
    });

    // Should roll back to original state
    await waitFor(() => {
      expect(result.current.liked).toBe(false);
      expect(result.current.count).toBe(5);
    });
  });

  it('network error rolls back state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useThoughtLike('thought-1', true, 10));

    await act(async () => {
      result.current.toggle();
    });

    // Should roll back to original state
    await waitFor(() => {
      expect(result.current.liked).toBe(true);
      expect(result.current.count).toBe(10);
    });
  });

  it('isLoading is true during API call and false after', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useThoughtLike('thought-1', false, 5));

    // Start the toggle but don't await it
    act(() => {
      result.current.toggle();
    });

    // isLoading should be true while API call is pending
    expect(result.current.isLoading).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ liked: true, likeCount: 6 }),
      });
    });

    // isLoading should be false after API call completes
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('calls the correct API endpoint with POST method', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 6 }),
    });

    const { result } = renderHook(() => useThoughtLike('thought-abc-123', false, 5));

    await act(async () => {
      result.current.toggle();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/thoughts/thought-abc-123/like', {
      method: 'POST',
    });
  });
});
