'use client';

import { useState, useCallback } from 'react';

interface ThoughtFormProps {
  isAuthenticated: boolean;
  isCreating: boolean;
  onSubmit: (content: string) => Promise<void>;
}

export function ThoughtForm({ isAuthenticated, isCreating, onSubmit }: ThoughtFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = content.trim();
      if (trimmed.length < 5) {
        setError('답변은 최소 5자 이상 입력해주세요.');
        return;
      }
      if (trimmed.length > 1000) {
        setError('답변은 최대 1000자까지 입력 가능합니다.');
        return;
      }

      try {
        await onSubmit(trimmed);
        setContent('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '답변 작성에 실패했습니다.');
      }
    },
    [content, onSubmit]
  );

  if (!isAuthenticated) {
    return (
      <div className="py-4 text-center border-t border-[rgba(2,9,18,0.15)]">
        <p className="text-sm text-[#020912]/40">
          로그인 후 생각을 공유해 보세요
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[rgba(2,9,18,0.15)] pt-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="나의 생각을 공유해 주세요..."
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2.5 text-sm text-[#020912] bg-[#020912]/[0.02] border border-[rgba(2,9,18,0.15)] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 resize-none transition-all duration-200"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#020912]/30">
            {content.length}/1000
          </span>
          <button
            type="submit"
            disabled={isCreating || content.trim().length < 5}
            className="px-4 py-1.5 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isCreating ? '보내는 중...' : '보내기'}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
