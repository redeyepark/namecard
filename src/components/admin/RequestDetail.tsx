'use client';

import { useState, useCallback } from 'react';
import type { CardRequest } from '@/types/request';
import { isTerminalStatus, requiresFeedback } from '@/types/request';
import { StatusBadge } from './StatusBadge';
import { CardCompare } from './CardCompare';
import { IllustrationUploader } from './IllustrationUploader';
import { StatusHistory } from './StatusHistory';

interface RequestDetailProps {
  request: CardRequest;
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  onUpdate: () => void;
}

type ActiveAction = 'reject' | 'revision_request' | null;

export function RequestDetail({
  request,
  originalAvatarUrl,
  illustrationUrl,
  onUpdate,
}: RequestDetailProps) {
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [illustrationUrlInput, setIllustrationUrlInput] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  const { status } = request;
  const isTerminal = isTerminalStatus(status);
  const canRegister = status === 'submitted' && (illustrationPreview || illustrationUrl || illustrationUrlInput);
  const canConfirm = status === 'processing';
  const showIllustrationUploader = status === 'submitted';

  // Find the latest admin feedback from status history
  const latestFeedbackEntry = [...request.statusHistory]
    .reverse()
    .find((entry) => entry.adminFeedback);

  const handleRegister = useCallback(async () => {
    if (!illustrationPreview && !illustrationUrl && !illustrationUrlInput) return;
    setActionLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { status: 'processing' };
      // URL takes precedence over file upload if both exist
      if (illustrationUrlInput) {
        body.illustrationUrl = illustrationUrlInput;
      } else if (illustrationPreview) {
        body.illustrationImage = illustrationPreview;
      }

      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '등록에 실패했습니다.');
      }

      setIllustrationPreview(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, illustrationPreview, illustrationUrl, illustrationUrlInput, onUpdate]);

  const handleConfirm = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '확정에 실패했습니다.');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '확정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, onUpdate]);

  const handleReject = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          adminFeedback: feedbackText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '반려에 실패했습니다.');
      }

      setFeedbackText('');
      setActiveAction(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '반려에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, feedbackText, onUpdate]);

  const handleRevisionRequest = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'revision_requested',
          adminFeedback: feedbackText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '수정 요청에 실패했습니다.');
      }

      setFeedbackText('');
      setActiveAction(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 요청에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, feedbackText, onUpdate]);

  const handleDeliver = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || '배송 완료 처리에 실패했습니다.');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '배송 완료 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }, [request.id, onUpdate]);

  const handleCancelAction = useCallback(() => {
    setActiveAction(null);
    setFeedbackText('');
  }, []);

  const submittedDate = new Date(request.submittedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDate = new Date(request.updatedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              {request.card.front.displayName}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs font-mono text-gray-400">{request.id}</p>
        </div>
      </div>

      {/* Status banners */}
      {status === 'confirmed' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            이 의뢰는 확정 완료되었습니다.
          </p>
        </div>
      )}
      {status === 'rejected' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            이 의뢰는 반려되었습니다.
          </p>
          {latestFeedbackEntry?.adminFeedback && (
            <p className="text-sm text-red-600 mt-1">
              사유: {latestFeedbackEntry.adminFeedback}
            </p>
          )}
        </div>
      )}
      {status === 'delivered' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-700 font-medium">
            이 의뢰는 배송 완료되었습니다.
          </p>
        </div>
      )}
      {status === 'cancelled' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 font-medium">
            이 의뢰는 사용자에 의해 취소되었습니다.
          </p>
        </div>
      )}
      {status === 'revision_requested' && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 font-medium">
            사용자에게 수정을 요청한 상태입니다.
          </p>
          {latestFeedbackEntry?.adminFeedback && (
            <p className="text-sm text-orange-600 mt-1">
              요청 내용: {latestFeedbackEntry.adminFeedback}
            </p>
          )}
        </div>
      )}

      {/* Card data */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-medium text-gray-700 mb-3">카드 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">표시 이름</span>
            <p className="font-medium text-gray-900">{request.card.front.displayName}</p>
          </div>
          <div>
            <span className="text-gray-500">전체 이름</span>
            <p className="font-medium text-gray-900">{request.card.back.fullName}</p>
          </div>
          <div>
            <span className="text-gray-500">직함</span>
            <p className="font-medium text-gray-900">{request.card.back.title || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">해시태그</span>
            <p className="font-medium text-gray-900">
              {request.card.back.hashtags.length > 0
                ? request.card.back.hashtags.join(', ')
                : '-'}
            </p>
          </div>
          {request.card.back.socialLinks.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-gray-500">소셜 링크</span>
              <div className="mt-1 space-y-1">
                {request.card.back.socialLinks.map((link, i) => (
                  <p key={i} className="text-gray-900 text-xs">
                    <span className="font-medium">{link.platform}</span>: {link.url}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500">앞면 배경색</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded border border-gray-200"
                style={{ backgroundColor: request.card.front.backgroundColor }}
              />
              <span className="text-xs font-mono text-gray-600">
                {request.card.front.backgroundColor}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">뒷면 배경색</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded border border-gray-200"
                style={{ backgroundColor: request.card.back.backgroundColor }}
              />
              <span className="text-xs font-mono text-gray-600">
                {request.card.back.backgroundColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image comparison */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-medium text-gray-700 mb-3">이미지 비교</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <CardCompare
              originalAvatarUrl={originalAvatarUrl}
              illustrationUrl={illustrationUrl}
              illustrationPreview={illustrationPreview}
            />
          </div>
          {showIllustrationUploader && (
            <div className="sm:w-[200px] shrink-0">
              <p className="text-xs font-medium text-gray-500 mb-2">일러스트 업로드</p>
              <IllustrationUploader
                currentImage={illustrationPreview}
                onImageSelect={setIllustrationPreview}
                onUrlInput={setIllustrationUrlInput}
                disabled={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* User note */}
      {request.note && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-2">사용자 메모</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Dates */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">제출일</span>
            <p className="text-gray-900">{submittedDate}</p>
          </div>
          <div>
            <span className="text-gray-500">최종 수정일</span>
            <p className="text-gray-900">{updatedDate}</p>
          </div>
        </div>
      </div>

      {/* Status history */}
      {request.statusHistory.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <StatusHistory history={request.statusHistory} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Feedback textarea (shown when activeAction is set) */}
      {activeAction && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {activeAction === 'reject' ? '반려 사유' : '수정 요청 내용'}
          </h3>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={
              activeAction === 'reject'
                ? '반려 사유를 입력해 주세요...'
                : '수정이 필요한 내용을 입력해 주세요...'
            }
            className="w-full min-h-[100px] p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
            disabled={actionLoading}
            aria-label={activeAction === 'reject' ? '반려 사유' : '수정 요청 내용'}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={activeAction === 'reject' ? handleReject : handleRevisionRequest}
              disabled={!feedbackText.trim() || actionLoading}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                activeAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {actionLoading
                ? '처리 중...'
                : activeAction === 'reject'
                  ? '반려 확인'
                  : '수정 요청 확인'}
            </button>
            <button
              type="button"
              onClick={handleCancelAction}
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isTerminal && status !== 'revision_requested' && !activeAction && (
        <div className="flex gap-3">
          {status === 'submitted' && (
            <>
              <button
                type="button"
                onClick={handleRegister}
                disabled={!canRegister || actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '처리 중...' : '등록'}
              </button>
              <button
                type="button"
                onClick={() => setActiveAction('reject')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                반려
              </button>
            </>
          )}
          {canConfirm && (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '처리 중...' : '확정'}
              </button>
              <button
                type="button"
                onClick={() => setActiveAction('revision_request')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                수정 요청
              </button>
            </>
          )}
          {status === 'confirmed' && (
            <button
              type="button"
              onClick={handleDeliver}
              disabled={actionLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? '처리 중...' : '배송 완료'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
