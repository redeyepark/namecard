'use client';

import { useState, useCallback, useRef } from 'react';
import type { CardRequest } from '@/types/request';
import type { SocialLink } from '@/types/card';
import { Button, Input, Textarea, Select } from '@/components/ui';

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
        <h1 className="text-lg font-bold text-text-primary">요청 수정</h1>
        <p className="text-sm text-text-secondary mt-1">
          카드 정보를 수정한 후 저장하세요.
        </p>
      </div>

      {/* Display name */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <Input
          id="displayName"
          label="표시 이름"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
          helperText={`${displayName.length}/40`}
          className="min-h-[44px]"
        />
      </div>

      {/* Full name */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <Input
          id="fullName"
          label="전체 이름"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={50}
          required
          helperText={`${fullName.length}/50`}
          className="min-h-[44px]"
        />
      </div>

      {/* Title */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <Input
          id="title"
          label="직함"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          helperText={`${title.length}/80`}
          className="min-h-[44px]"
        />
      </div>

      {/* Hashtags */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <label className="block text-sm font-medium text-text-primary mb-2">
          해시태그
        </label>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg text-text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(index)}
                  className="text-text-tertiary hover:text-error transition-colors p-0.5"
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
          <Input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            placeholder="#태그"
            maxLength={30}
            className="min-h-[44px]"
            aria-label="해시태그 입력"
          />
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleAddHashtag}
            className="min-h-[44px]"
          >
            추가
          </Button>
        </div>
      </div>

      {/* Social links */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <label className="block text-sm font-medium text-text-primary mb-2">
          소셜 링크
        </label>

        {socialLinks.length > 0 && (
          <div className="space-y-3 mb-3">
            {socialLinks.map((link, index) => (
              <div key={index} className="border border-divider rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">링크 {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(index)}
                    className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1"
                    aria-label={`링크 ${index + 1} 삭제`}
                  >
                    삭제
                  </button>
                </div>
                <Select
                  value={link.platform}
                  onChange={(e) =>
                    handleUpdateSocialLink(index, 'platform', e.target.value)
                  }
                  options={PLATFORM_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  className="min-h-[44px]"
                  aria-label={`링크 ${index + 1} 플랫폼`}
                />
                <Input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleUpdateSocialLink(index, 'url', e.target.value)}
                  placeholder="URL 또는 이메일"
                  className="min-h-[44px]"
                  aria-label={`링크 ${index + 1} URL`}
                />
                <Input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleUpdateSocialLink(index, 'label', e.target.value)}
                  placeholder="표시 라벨 (선택)"
                  className="min-h-[44px]"
                  aria-label={`링크 ${index + 1} 라벨`}
                />
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={handleAddSocialLink}
          className="w-full border border-dashed border-border-medium text-text-secondary hover:border-primary/40 hover:text-text-primary min-h-[44px]"
        >
          + 링크 추가
        </Button>
      </div>

      {/* Note */}
      <div className="bg-surface rounded-xl p-4 border border-bg">
        <Textarea
          id="note"
          label="메모"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="추가 요청 사항을 입력하세요"
          className="resize-y"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-error/5 border border-error/20 rounded-lg" role="alert">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={saving || !displayName.trim() || !fullName.trim()}
          onClick={() => { confirmRef.current = false; }}
          className="min-h-[44px]"
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={saving || !displayName.trim() || !fullName.trim()}
          onClick={() => { confirmRef.current = true; }}
          className="bg-success hover:bg-success/90 min-h-[44px]"
        >
          {saving ? '처리 중...' : '저장 후 확정'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onCancel}
          disabled={saving}
          className="min-h-[44px]"
        >
          취소
        </Button>
      </div>
    </form>
  );
}
