'use client';

import { useState, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import { HashtagChip } from './HashtagChip';

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, hashtags: string[]) => Promise<void>;
  isCreating: boolean;
}

export function QuestionForm({ isOpen, onClose, onSubmit, isCreating }: QuestionFormProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addTag = useCallback(() => {
    const cleaned = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!cleaned) return;
    if (cleaned.length > 20) {
      setError('해시태그는 최대 20자까지 입력 가능합니다.');
      return;
    }
    if (hashtags.length >= 5) {
      setError('해시태그는 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    if (hashtags.includes(cleaned)) {
      setError('이미 추가된 해시태그입니다.');
      return;
    }
    setHashtags((prev) => [...prev, cleaned]);
    setTagInput('');
    setError(null);
  }, [tagInput, hashtags]);

  const removeTag = useCallback((tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = content.trim();
      if (trimmed.length < 10) {
        setError('질문은 최소 10자 이상 입력해주세요.');
        return;
      }
      if (trimmed.length > 500) {
        setError('질문은 최대 500자까지 입력 가능합니다.');
        return;
      }

      try {
        await onSubmit(trimmed, hashtags);
        setContent('');
        setHashtags([]);
        setTagInput('');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '질문 작성에 실패했습니다.');
      }
    },
    [content, hashtags, onSubmit, onClose]
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="질문하기" size="lg">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="궁금한 것을 질문해 보세요..."
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 resize-none transition-all duration-200"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-primary/30">{content.length}/500</span>
        </div>

        {/* Hashtag input */}
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="해시태그 입력 후 Enter"
              maxLength={20}
              className="flex-1 px-3 py-1.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 transition-all duration-200"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addTag}
            >
              추가
            </Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-primary/5 text-primary/70"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-primary/40 hover:text-primary"
                    aria-label={`${tag} 태그 삭제`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isCreating || content.trim().length < 10}
          >
            {isCreating ? '작성 중...' : '질문 올리기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
