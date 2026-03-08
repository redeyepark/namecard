'use client';

import { useState, useCallback } from 'react';
import type { CreateSurveyInput } from '@/types/survey';
import { Modal, Button } from '@/components/ui';

interface SurveyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSurveyInput) => Promise<void>;
  isCreating: boolean;
}

export function SurveyForm({ isOpen, onClose, onSubmit, isCreating }: SurveyFormProps) {
  const [question, setQuestion] = useState('');
  const [selectMode, setSelectMode] = useState<'single' | 'multi'>('single');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [closesAt, setClosesAt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addOption = useCallback(() => {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, '']);
  }, [options.length]);

  const removeOption = useCallback((index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, [options.length]);

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }, []);

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

  const isValid = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 10 || trimmedQuestion.length > 500) return false;
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) return false;
    for (const opt of options) {
      if (opt.trim().length > 0 && opt.trim().length > 200) return false;
    }
    return true;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedQuestion = question.trim();
      if (trimmedQuestion.length < 10) {
        setError('질문은 최소 10자 이상 입력해주세요.');
        return;
      }
      if (trimmedQuestion.length > 500) {
        setError('질문은 최대 500자까지 입력 가능합니다.');
        return;
      }

      const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
      if (validOptions.length < 2) {
        setError('옵션은 최소 2개 이상 입력해주세요.');
        return;
      }
      for (const opt of validOptions) {
        if (opt.length > 200) {
          setError('각 옵션은 최대 200자까지 입력 가능합니다.');
          return;
        }
      }

      try {
        const input: CreateSurveyInput = {
          question: trimmedQuestion,
          options: validOptions,
          selectMode,
          ...(hashtags.length > 0 && { hashtags }),
          ...(closesAt && { closesAt: new Date(closesAt).toISOString() }),
        };
        await onSubmit(input);
        // Reset form
        setQuestion('');
        setSelectMode('single');
        setOptions(['', '']);
        setClosesAt('');
        setHashtags([]);
        setTagInput('');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '설문 등록에 실패했습니다.');
      }
    },
    [question, options, selectMode, hashtags, closesAt, onSubmit, onClose]
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="설문 만들기" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Question */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="설문 질문을 입력하세요..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 resize-none transition-all duration-200"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-primary/30">{question.length}/500</span>
        </div>

        {/* Select mode */}
        <div className="mt-3">
          <label className="text-xs font-medium text-primary/60 mb-1.5 block">
            투표 방식
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectMode('single')}
              className={`px-3 py-1.5 text-sm font-medium border transition-all duration-200 ${
                selectMode === 'single'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border-medium text-primary/40 hover:border-primary/40'
              }`}
            >
              단일 선택
            </button>
            <button
              type="button"
              onClick={() => setSelectMode('multi')}
              className={`px-3 py-1.5 text-sm font-medium border transition-all duration-200 ${
                selectMode === 'multi'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border-medium text-primary/40 hover:border-primary/40'
              }`}
            >
              복수 선택
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="mt-3">
          <label className="text-xs font-medium text-primary/60 mb-1.5 block">
            옵션 (2~10개)
          </label>
          <div className="flex flex-col gap-2">
            {options.map((opt, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`옵션 ${index + 1}`}
                  maxLength={200}
                  className="flex-1 px-3 py-1.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                  className="px-2 text-primary/30 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label={`옵션 ${index + 1} 삭제`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addOption}
            disabled={options.length >= 10}
            className="mt-2"
          >
            + 옵션 추가
          </Button>
        </div>

        {/* Close date */}
        <div className="mt-3">
          <label className="text-xs font-medium text-primary/60 mb-1.5 block">
            마감일 (선택사항)
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-primary bg-primary/[0.02] border border-border-medium focus:outline-none focus:border-primary/40 transition-all duration-200"
          />
        </div>

        {/* Hashtag input */}
        <div className="mt-3">
          <label className="text-xs font-medium text-primary/60 mb-1.5 block">
            해시태그 (선택사항, 최대 5개)
          </label>
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
            disabled={isCreating || !isValid()}
          >
            {isCreating ? '등록 중...' : '설문 등록'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
