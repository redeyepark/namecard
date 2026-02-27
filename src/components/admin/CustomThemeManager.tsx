'use client';

import { useState, useCallback } from 'react';
import type { CustomTheme } from '@/types/custom-theme';
import { useCustomThemes } from '@/hooks/useCustomThemes';
import { CustomThemeForm } from '@/components/admin/CustomThemeForm';

/**
 * Main management section for custom themes in the admin panel.
 * Lists all custom themes in a grid, supports create/edit/delete operations.
 */
export function CustomThemeManager() {
  const { themes, isLoading, error, refetch } = useCustomThemes();

  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all custom themes (admin endpoint returns all including inactive)
  const fetchAdminThemes = useCallback(async (): Promise<CustomTheme[]> => {
    const res = await fetch('/api/admin/custom-themes');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.themes ?? [];
  }, []);

  const [adminThemes, setAdminThemes] = useState<CustomTheme[] | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Load admin themes on mount
  const loadAdminThemes = useCallback(async () => {
    setAdminLoading(true);
    try {
      const data = await fetchAdminThemes();
      setAdminThemes(data);
    } catch {
      // Fallback to public themes
      setAdminThemes(themes ?? []);
    } finally {
      setAdminLoading(false);
    }
  }, [fetchAdminThemes, themes]);

  // Load on first render
  if (adminThemes === null && !adminLoading) {
    loadAdminThemes();
  }

  const displayThemes = adminThemes ?? themes ?? [];

  const handleCreate = () => {
    setEditingTheme(undefined);
    setShowForm(true);
    setMessage(null);
  };

  const handleEdit = (theme: CustomTheme) => {
    setEditingTheme(theme);
    setShowForm(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTheme(undefined);
  };

  const handleSave = async (themeData: CustomTheme) => {
    setSaving(true);
    setMessage(null);
    try {
      const isEdit = !!editingTheme?.id;
      const url = isEdit
        ? `/api/admin/custom-themes/${editingTheme.id}`
        : '/api/admin/custom-themes';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData),
      });

      if (!res.ok) {
        const errData = await res.json();
        const detail = errData.details || errData.error || 'Unknown error';
        if (res.status === 409) {
          setMessage({ type: 'error', text: `슬러그가 이미 존재합니다: ${detail}` });
        } else {
          setMessage({ type: 'error', text: `저장 실패: ${detail}` });
        }
        return;
      }

      setMessage({ type: 'success', text: isEdit ? '테마가 수정되었습니다.' : '테마가 생성되었습니다.' });
      setShowForm(false);
      setEditingTheme(undefined);
      await loadAdminThemes();
      refetch();
    } catch {
      setMessage({ type: 'error', text: '서버 연결에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/custom-themes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409) {
          const count = errData.usageCount || 0;
          setMessage({
            type: 'error',
            text: `이 테마는 ${count}건의 의뢰에서 사용 중이므로 삭제할 수 없습니다.`,
          });
        } else {
          setMessage({ type: 'error', text: `삭제 실패: ${errData.error || 'Unknown error'}` });
        }
        return;
      }

      setMessage({ type: 'success', text: '테마가 삭제되었습니다.' });
      await loadAdminThemes();
      refetch();
    } catch {
      setMessage({ type: 'error', text: '서버 연결에 실패했습니다.' });
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#020912]">커스텀 테마 관리</h2>
          <p className="text-xs text-[#020912]/50 mt-0.5">
            직접 색상과 스타일을 지정하여 새로운 테마를 만들 수 있습니다.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleCreate}
            className="min-h-[44px] px-4 text-sm font-medium text-white bg-[#020912] hover:bg-[#020912]/80 transition-colors"
          >
            + 새 테마 만들기
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 text-sm ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Form (create/edit) */}
      {showForm && (
        <CustomThemeForm
          initialTheme={editingTheme}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Loading state */}
      {(isLoading || adminLoading) && !showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 w-24 mb-1" />
                  <div className="h-3 bg-gray-100 w-16" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && !adminLoading && (
        <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-700">
          테마 목록을 불러오는데 실패했습니다.
          <button
            type="button"
            onClick={() => loadAdminThemes()}
            className="ml-2 underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Theme grid */}
      {!isLoading && !adminLoading && !showForm && displayThemes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayThemes.map((theme) => (
            <div
              key={theme.id}
              className="border border-[rgba(2,9,18,0.15)] bg-white p-4 hover:border-[#020912]/30 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                {/* Color swatch */}
                <div className="flex-shrink-0 w-10 h-10 relative overflow-hidden border border-gray-200">
                  <div
                    className="absolute inset-0 w-1/2 h-full"
                    style={{ backgroundColor: theme.frontBgColor }}
                  />
                  <div
                    className="absolute right-0 top-0 w-1/2 h-full"
                    style={{ backgroundColor: theme.backBgColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#020912] truncate">{theme.name}</h4>
                  <p className="text-[10px] text-[#020912]/40 truncate">{theme.slug}</p>
                </div>

                {/* Status badge */}
                <span
                  className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 ${
                    theme.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {theme.isActive ? '활성' : '비활성'}
                </span>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-[#020912]/50 bg-gray-50 px-1.5 py-0.5">
                  {theme.baseTemplate === 'classic' ? 'Classic' : 'Nametag'}
                </span>
                <span className="text-[10px] text-[#020912]/50 bg-gray-50 px-1.5 py-0.5">
                  {theme.fontFamily}
                </span>
                {theme.customFields.length > 0 && (
                  <span className="text-[10px] text-[#020912]/50 bg-gray-50 px-1.5 py-0.5">
                    {theme.customFields.length} fields
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(theme)}
                  disabled={saving}
                  className="min-h-[36px] flex-1 px-3 text-xs font-medium text-[#020912] bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(theme.id)}
                  disabled={deleting}
                  className="min-h-[36px] px-3 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !adminLoading && !showForm && displayThemes.length === 0 && !error && (
        <div className="text-center py-12 text-sm text-[#020912]/40 border border-dashed border-gray-200">
          등록된 커스텀 테마가 없습니다.
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 id="delete-confirm-title" className="text-base font-semibold text-[#020912] mb-2">
              테마 삭제 확인
            </h3>
            <p className="text-sm text-[#020912]/70 mb-1">
              이 테마를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-amber-600 mb-4">
              의뢰에서 사용 중인 테마는 삭제할 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="min-h-[44px] px-4 text-sm font-medium text-[#020912]/70 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                disabled={deleting}
                className="min-h-[44px] px-4 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
