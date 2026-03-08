'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';

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
      if (trimmed.length < 1) {
        setError('답변을 입력해주세요.');
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
      <div className="py-4 text-center border-t border-border-medium">
        <p className="text-sm text-primary/40">
          로그인 후 생각을 공유해 보세요
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-medium pt-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="나의 생각을 공유해 주세요..."
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2.5 text-sm text-primary bg-primary/[0.02] border border-border-medium placeholder:text-primary/30 focus:outline-none focus:border-primary/40 resize-none transition-all duration-200"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-primary/30">
            {content.length}/1000
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isCreating || content.trim().length < 1}
          >
            {isCreating ? '보내는 중...' : '보내기'}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}
    </form>
  );
}
