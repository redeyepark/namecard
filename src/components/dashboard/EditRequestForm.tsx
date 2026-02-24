'use client';

import { useState, useCallback, useRef } from 'react';
import type { CardRequest } from '@/types/request';
import type { SocialLink } from '@/types/card';

interface EditRequestFormProps {
  request: CardRequest & { originalAvatarUrl: string | null };
  onSave: () => void;
  onCancel: () => void;
}

const PLATFORM_OPTIONS: { value: SocialLink['platform']; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'custom', label: 'Custom' },
];

export function EditRequestForm({ request, onSave, onCancel }: EditRequestFormProps) {
  const [displayName, setDisplayName] = useState(request.card.front.displayName);
  const [fullName, setFullName] = useState(request.card.back.fullName);
  const [title, setTitle] = useState(request.card.back.title);
  const [hashtags, setHashtags] = useState<string[]>([...request.card.back.hashtags]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    request.card.back.socialLinks.map((link) => ({ ...link }))
  );
  const [note, setNote] = useState(request.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef(false);

  // Hashtag handlers
  const handleAddHashtag = useCallback(() => {
    const trimmed = hashtagInput.trim();
    if (!trimmed) return;
    const tag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput('');
  }, [hashtagInput, hashtags]);

  const handleHashtagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddHashtag();
      }
    },
    [handleAddHashtag]
  );

  const handleRemoveHashtag = useCallback((index: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Social link handlers
  const handleAddSocialLink = useCallback(() => {
    setSocialLinks((prev) => [...prev, { platform: 'custom', url: '', label: '' }]);
  }, []);

  const handleRemoveSocialLink = useCallback((index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateSocialLink = useCallback(
    (index: number, field: keyof SocialLink, value: string) => {
      setSocialLinks((prev) =>
        prev.map((link, i) =>
          i === index ? { ...link, [field]: value } : link
        )
      );
    },
    []
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);

      // Filter out empty social links
      const filteredLinks = socialLinks.filter(
        (link) => link.url.trim() || link.label.trim()
      );

      const body = {
        card: {
          front: {
            displayName,
            backgroundColor: request.card.front.backgroundColor,
            avatarImage: request.card.front.avatarImage,
          },
          back: {
            fullName,
            title,
            hashtags,
            socialLinks: filteredLinks,
            backgroundColor: request.card.back.backgroundColor,
          },
        },
        note: note || undefined,
        confirm: confirmRef.current,
      };

      try {
        const res = await fetch(`/api/requests/my/${request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '저장에 실패했습니다.');
        }

        confirmRef.current = false;
        onSave();
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      } finally {
        confirmRef.current = false;
        setSaving(false);
      }
    },
    [displayName, fullName, title, hashtags, socialLinks, note, request, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">요청 수정</h1>
        <p className="text-sm text-gray-500 mt-1">
          카드 정보를 수정한 후 저장하세요.
        </p>
      </div>

      {/* Display name */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          표시 이름
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <p className="text-xs text-gray-400 mt-1">{displayName.length}/40</p>
      </div>

      {/* Full name */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          전체 이름
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={50}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <p className="text-xs text-gray-400 mt-1">{fullName.length}/50</p>
      </div>

      {/* Title */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          직함
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/80</p>
      </div>

      {/* Hashtags */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          해시태그
        </label>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                  aria-label={`${tag} 삭제`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            placeholder="#태그"
            maxLength={30}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            aria-label="해시태그 입력"
          />
          <button
            type="button"
            onClick={handleAddHashtag}
            className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px]"
          >
            추가
          </button>
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          소셜 링크
        </label>

        {socialLinks.length > 0 && (
          <div className="space-y-3 mb-3">
            {socialLinks.map((link, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">링크 {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(index)}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors px-2 py-1"
                    aria-label={`링크 ${index + 1} 삭제`}
                  >
                    삭제
                  </button>
                </div>
                <select
                  value={link.platform}
                  onChange={(e) =>
                    handleUpdateSocialLink(index, 'platform', e.target.value)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  aria-label={`링크 ${index + 1} 플랫폼`}
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleUpdateSocialLink(index, 'url', e.target.value)}
                  placeholder="URL 또는 이메일"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  aria-label={`링크 ${index + 1} URL`}
                />
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleUpdateSocialLink(index, 'label', e.target.value)}
                  placeholder="표시 라벨 (선택)"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  aria-label={`링크 ${index + 1} 라벨`}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddSocialLink}
          className="w-full px-4 py-2.5 border border-dashed border-gray-300 text-gray-600 text-sm rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors min-h-[44px]"
        >
          + 링크 추가
        </button>
      </div>

      {/* Note */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          메모
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="추가 요청 사항을 입력하세요"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !displayName.trim() || !fullName.trim()}
          onClick={() => { confirmRef.current = false; }}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          type="submit"
          disabled={saving || !displayName.trim() || !fullName.trim()}
          onClick={() => { confirmRef.current = true; }}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[#2d8c3c] rounded-lg hover:bg-[#246e30] transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '처리 중...' : '저장 후 확정'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
