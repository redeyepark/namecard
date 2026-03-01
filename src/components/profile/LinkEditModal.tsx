'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { UserLink } from '@/types/profile';

interface LinkEditModalProps {
  link?: UserLink;
  onSave: (data: { title: string; url: string }) => void;
  onClose: () => void;
}

/**
 * Modal dialog for adding or editing a link.
 * Overlay with centered form, keyboard accessible.
 */
export function LinkEditModal({ link, onSave, onClose }: LinkEditModalProps) {
  const [title, setTitle] = useState(link?.title ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus the title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Trap focus within modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const validate = (): boolean => {
    const newErrors: { title?: string; url?: string } = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해 주세요';
    } else if (title.length > 100) {
      newErrors.title = '제목은 100자 이내로 입력해 주세요';
    }

    if (!url.trim()) {
      newErrors.url = 'URL을 입력해 주세요';
    } else {
      try {
        new URL(url);
      } catch {
        newErrors.url = '올바른 URL 형식이 아닙니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ title: title.trim(), url: url.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={link ? '링크 수정' : '링크 추가'}
        className="w-full max-w-md mx-4 bg-[var(--color-surface)] border border-[var(--color-divider)] p-6 animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[family-name:var(--font-heading),sans-serif] text-lg font-medium text-[var(--color-text-primary)]">
            {link ? '링크 수정' : '링크 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Title input */}
          <div className="mb-4">
            <label
              htmlFor="link-title"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
            >
              제목
            </label>
            <input
              ref={titleInputRef}
              id="link-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="링크 제목을 입력하세요"
              className="w-full h-10 px-3 border border-[var(--color-divider)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-xs text-red-500">
                {errors.title}
              </p>
            )}
          </div>

          {/* URL input */}
          <div className="mb-6">
            <label
              htmlFor="link-url"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
            >
              URL
            </label>
            <input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-10 px-3 border border-[var(--color-divider)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? 'url-error' : undefined}
            />
            {errors.url && (
              <p id="url-error" className="mt-1 text-xs text-red-500">
                {errors.url}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="h-10 px-4 text-sm font-medium text-[var(--color-secondary)] bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
