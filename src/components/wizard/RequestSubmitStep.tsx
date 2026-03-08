'use client';

import { useState, useCallback } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface SubmitResult {
  id: string;
  submittedAt: string;
}

export function RequestSubmitStep() {
  const card = useCardStore((state) => state.card);
  const resetWizard = useCardStore((state) => state.resetWizard);

  const [note, setNote] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(async () => {
    setSubmitState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card,
          avatarImage: card.front.avatarImage,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || '의뢰 제출에 실패했습니다.');
      }

      const data = await response.json();
      setResult({ id: data.id, submittedAt: data.submittedAt });
      setSubmitState('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '의뢰 제출에 실패했습니다. 다시 시도해주세요.'
      );
      setSubmitState('error');
    }
  }, [card, note]);

  // Success state
  if (submitState === 'success' && result) {
    const submittedDate = new Date(result.submittedAt);
    const formattedDate = submittedDate.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <section aria-label="Request submitted">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor" className="text-success"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">
            의뢰가 접수되었습니다!
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            어드민이 확인 후 손그림 일러스트로 제작해 드립니다.
          </p>
        </div>

        <div className="bg-bg rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">요청 ID</span>
            <span className="font-mono text-primary text-xs">
              {result.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">제출 시간</span>
            <span className="text-primary">{formattedDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">상태</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
              의뢰됨
            </span>
          </div>
        </div>

        <div className="max-w-xs mx-auto">
          <button
            type="button"
            onClick={resetWizard}
            className="w-full px-4 py-2.5 text-sm font-medium text-text-primary bg-surface border border-border-medium rounded-lg hover:bg-bg transition-colors min-h-[44px]"
          >
            새 명함 만들기
          </button>
        </div>
      </section>
    );
  }

  // Idle / Loading / Error state
  return (
    <section aria-label="Request submission">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary">명함 의뢰하기</h2>
        <p className="mt-1 text-sm text-text-secondary">
          아래 내용을 확인하고 의뢰를 제출하세요.
        </p>
      </div>

      {/* Card preview */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center sm:items-start mb-6">
        <div className="w-full max-w-[260px]">
          <p className="text-xs font-medium text-text-secondary mb-2 text-center">앞면</p>
          <CardFront />
        </div>
        <div className="w-full max-w-[260px]">
          <p className="text-xs font-medium text-text-secondary mb-2 text-center">뒷면</p>
          <CardBack />
        </div>
      </div>

      {/* Note field */}
      <div className="mb-6">
        <label
          htmlFor="request-note"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          메모 (선택)
        </label>
        <textarea
          id="request-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="일러스트 스타일이나 요청사항을 적어주세요..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-border-medium rounded-lg text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent"
        />
        <p className="text-xs text-text-tertiary text-right mt-1">
          {note.length}/500
        </p>
      </div>

      {/* Error message */}
      {submitState === 'error' && errorMessage && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg" role="alert">
          <p className="text-sm text-error">{errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 max-w-xs mx-auto">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitState === 'loading'}
          className="w-full px-4 py-2.5 text-sm font-medium text-secondary bg-error rounded-lg hover:bg-error/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitState === 'loading' ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              제출 중...
            </>
          ) : submitState === 'error' ? (
            '재시도'
          ) : (
            '의뢰하기'
          )}
        </button>
      </div>
    </section>
  );
}
