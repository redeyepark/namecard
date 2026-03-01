'use client';

import { useState, useCallback } from 'react';
import type { UserLink } from '@/types/profile';

/**
 * Custom hook for link CRUD operations.
 * Manages state and API calls for user links.
 */
export function useLinks(initialLinks: UserLink[]) {
  const [links, setLinks] = useState<UserLink[]>(initialLinks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profiles/me/links');
      if (!res.ok) {
        throw new Error('Failed to fetch links');
      }
      const data = await res.json();
      setLinks(data.links ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLink = useCallback(
    async (data: { title: string; url: string; icon?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/profiles/me/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create link');
        }
        const created = await res.json();
        setLinks((prev) => [...prev, created]);
        return created as UserLink;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateLink = useCallback(
    async (
      linkId: string,
      data: { title?: string; url?: string; icon?: string; isActive?: boolean }
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profiles/me/links/${linkId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            url: data.url,
            icon: data.icon,
            is_active: data.isActive,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update link');
        }
        const updated = await res.json();
        setLinks((prev) =>
          prev.map((link) => (link.id === linkId ? updated : link))
        );
        return updated as UserLink;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteLink = useCallback(async (linkId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/me/links/${linkId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete link');
      }
      setLinks((prev) => prev.filter((link) => link.id !== linkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reorderLinks = useCallback(async (linkIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profiles/me/links/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reorder links');
      }
      // Reorder the local state to match the new order
      setLinks((prev) => {
        const linkMap = new Map(prev.map((link) => [link.id, link]));
        return linkIds
          .map((id) => linkMap.get(id))
          .filter((link): link is UserLink => link !== undefined);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { links, isLoading, error, refresh, createLink, updateLink, deleteLink, reorderLinks };
}
