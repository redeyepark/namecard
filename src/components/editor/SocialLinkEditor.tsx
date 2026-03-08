'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { Button } from '@/components/ui';
import type { SocialLink } from '@/types/card';

const PLATFORM_OPTIONS: { value: SocialLink['platform']; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'custom', label: 'Custom' },
];

const EMPTY_LINK: SocialLink = { platform: 'custom', url: '', label: '' };

export function SocialLinkEditor() {
  const socialLinks = useCardStore((state) => state.card.back.socialLinks);
  const addSocialLink = useCardStore((state) => state.addSocialLink);
  const removeSocialLink = useCardStore((state) => state.removeSocialLink);
  const updateSocialLink = useCardStore((state) => state.updateSocialLink);
  const [newLink, setNewLink] = useState<SocialLink>({ ...EMPTY_LINK });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLink, setEditLink] = useState<SocialLink>({ ...EMPTY_LINK });

  const handleAdd = useCallback(() => {
    if (!newLink.url.trim() && !newLink.label.trim()) return;
    addSocialLink({ ...newLink });
    setNewLink({ ...EMPTY_LINK });
  }, [newLink, addSocialLink]);

  const handleStartEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditLink({ ...socialLinks[index] });
    },
    [socialLinks]
  );

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    updateSocialLink(editingIndex, { ...editLink });
    setEditingIndex(null);
    setEditLink({ ...EMPTY_LINK });
  }, [editingIndex, editLink, updateSocialLink]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditLink({ ...EMPTY_LINK });
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        Social Links
      </label>

      {/* Existing links */}
      {socialLinks.length > 0 && (
        <ul className="space-y-2">
          {socialLinks.map((link, index) => (
            <li
              key={index}
              className="border border-border-light rounded-lg p-3 text-sm"
            >
              {editingIndex === index ? (
                <div className="space-y-2">
                  <select
                    value={editLink.platform}
                    onChange={(e) =>
                      setEditLink({
                        ...editLink,
                        platform: e.target.value as SocialLink['platform'],
                      })
                    }
                    className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
                    aria-label="Edit platform"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editLink.url}
                    onChange={(e) =>
                      setEditLink({ ...editLink, url: e.target.value })
                    }
                    placeholder="URL or email"
                    className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
                    aria-label="Edit URL"
                  />
                  <input
                    type="text"
                    value={editLink.label}
                    onChange={(e) =>
                      setEditLink({ ...editLink, label: e.target.value })
                    }
                    placeholder="Display label"
                    className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
                    aria-label="Edit label"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="min-h-[44px]"
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="min-h-[44px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium capitalize">
                      {link.platform}
                    </span>
                    {link.label && (
                      <span className="text-text-secondary ml-2">{link.label}</span>
                    )}
                    {link.url && (
                      <span className="text-text-tertiary ml-2 text-xs truncate block max-w-full">
                        {link.url}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(index)}
                      className="px-2.5 py-1.5 text-xs text-primary hover:bg-primary/5 focus-visible:bg-primary/5 rounded-md transition-colors min-h-[36px]"
                      aria-label={`Edit ${link.platform} link`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="px-2.5 py-1.5 text-xs text-error hover:bg-error/10 focus-visible:bg-error/10 rounded-md transition-colors min-h-[36px]"
                      aria-label={`Remove ${link.platform} link`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add new link form */}
      <div className="border border-border-light rounded-lg p-3 sm:p-4 space-y-2">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Add New Link
        </p>
        <select
          value={newLink.platform}
          onChange={(e) =>
            setNewLink({
              ...newLink,
              platform: e.target.value as SocialLink['platform'],
            })
          }
          className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
          aria-label="Select platform"
        >
          {PLATFORM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          placeholder="URL or email address"
          className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
          aria-label="Link URL"
        />
        <input
          type="text"
          value={newLink.label}
          onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
          placeholder="Display label (optional)"
          className="w-full px-3 py-2.5 border border-border-medium rounded-radius-md text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[44px]"
          aria-label="Link label"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleAdd}
          className="w-full min-h-[44px]"
        >
          Add Link
        </Button>
      </div>
    </div>
  );
}
