'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import type { SocialLink } from '@/types/card';

const PLATFORM_OPTIONS: { value: SocialLink['platform']; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
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
      <label className="block text-sm font-medium text-gray-700">
        Social Links
      </label>

      {/* Existing links */}
      {socialLinks.length > 0 && (
        <ul className="space-y-2">
          {socialLinks.map((link, index) => (
            <li
              key={index}
              className="border border-gray-200 rounded-lg p-3 text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    aria-label="Edit URL"
                  />
                  <input
                    type="text"
                    value={editLink.label}
                    onChange={(e) =>
                      setEditLink({ ...editLink, label: e.target.value })
                    }
                    placeholder="Display label"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    aria-label="Edit label"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium capitalize">
                      {link.platform}
                    </span>
                    {link.label && (
                      <span className="text-gray-500 ml-2">{link.label}</span>
                    )}
                    {link.url && (
                      <span className="text-gray-400 ml-2 text-xs truncate block max-w-full">
                        {link.url}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(index)}
                      className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 focus-visible:bg-blue-50 rounded-md transition-colors min-h-[36px]"
                      aria-label={`Edit ${link.platform} link`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 focus-visible:bg-red-50 rounded-md transition-colors min-h-[36px]"
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
      <div className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Link URL"
        />
        <input
          type="text"
          value={newLink.label}
          onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
          placeholder="Display label (optional)"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Link label"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="w-full px-4 py-2.5 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 transition-colors min-h-[44px]"
        >
          Add Link
        </button>
      </div>
    </div>
  );
}
