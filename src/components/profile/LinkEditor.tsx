'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import type { UserLink } from '@/types/profile';
import { useLinks } from '@/hooks/useLinks';
import { LinkEditModal } from '@/components/profile/LinkEditModal';

interface LinkEditorProps {
  links: UserLink[];
  onUpdate: () => void;
}

/**
 * Owner-only link editor.
 * Shows all links (including inactive) with edit, toggle, and delete controls.
 */
export function LinkEditor({ links: initialLinks, onUpdate }: LinkEditorProps) {
  const { links, isLoading, createLink, updateLink, deleteLink } =
    useLinks(initialLinks);
  const [editingLink, setEditingLink] = useState<UserLink | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleAdd = () => {
    setEditingLink(null);
    setShowModal(true);
  };

  const handleEdit = (link: UserLink) => {
    setEditingLink(link);
    setShowModal(true);
  };

  const handleSave = async (data: { title: string; url: string }) => {
    if (editingLink) {
      await updateLink(editingLink.id, data);
    } else {
      await createLink(data);
    }
    setShowModal(false);
    setEditingLink(null);
    onUpdate();
  };

  const handleDelete = async (linkId: string) => {
    await deleteLink(linkId);
    onUpdate();
  };

  const handleToggleActive = async (link: UserLink) => {
    await updateLink(link.id, { isActive: !link.isActive });
    onUpdate();
  };

  return (
    <div className="mt-6 w-full">
      {/* Add link button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full h-[50px] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium disabled:opacity-50"
        aria-label="링크 추가"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span>링크 추가</span>
      </button>

      {/* Links list */}
      {links.length > 0 ? (
        <div className="flex flex-col gap-2 mt-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`flex items-center gap-3 px-4 h-[50px] border border-[var(--color-divider)] bg-[var(--color-surface)] ${
                !link.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Link info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {link.title}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                  {link.url}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Toggle active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(link)}
                  disabled={isLoading}
                  className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
                  aria-label={link.isActive ? '링크 비활성화' : '링크 활성화'}
                >
                  {link.isActive ? (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleEdit(link)}
                  disabled={isLoading}
                  className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
                  aria-label="링크 수정"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={isLoading}
                  className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-red-500 transition-colors disabled:opacity-50"
                  aria-label="링크 삭제"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-tertiary)] text-center mt-4">
          링크를 추가하세요
        </p>
      )}

      {/* Edit modal */}
      {showModal && (
        <LinkEditModal
          link={editingLink ?? undefined}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingLink(null);
          }}
        />
      )}
    </div>
  );
}
