'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { CardRequest } from '@/types/request';
import { isEditableStatus, isCancellableStatus } from '@/types/request';
import { ProgressStepper } from './ProgressStepper';
import { ConfirmedCardPreview } from './ConfirmedCardPreview';
import { CardCompare } from '@/components/admin/CardCompare';
import { StatusHistory } from '@/components/admin/StatusHistory';

interface MyRequestDetailProps {
  request: CardRequest & {
    originalAvatarUrl: string | null;
    illustrationUrl: string | null;
  };
  onEdit?: () => void;
  onRefresh?: () => void;
}

export function MyRequestDetail({ request, onEdit, onRefresh }: MyRequestDetailProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  // Find the latest admin feedback from status history
  const latestFeedback = [...request.statusHistory]
    .reverse()
    .find((entry) => entry.adminFeedback);

  const handleCancel = useCallback(async () => {
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/requests/my/${request.id}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '취소에 실패했습니다.');
      }

      setShowCancelConfirm(false);
      onRefresh?.();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : '취소에 실패했습니다.');
    } finally {
      setCancelLoading(false);
    }
  }, [request.id, onRefresh]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-[#020912]/60 hover:text-[#ffa639] transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        목록으로 돌아가기
      </Link>

      {/* Progress stepper */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <h2 className="text-sm font-medium text-[#020912]/70 mb-3">진행 상태</h2>
        <ProgressStepper currentStatus={request.status} />
      </div>

      {/* Admin feedback banner - revision_requested */}
      {request.status === 'revision_requested' && latestFeedback?.adminFeedback && (
        <div className="p-4 bg-[#ffdfc8]/50 border border-[#ffa639]/30" role="alert">
          <h3 className="text-sm font-semibold text-[#020912] mb-1">관리자 수정 요청</h3>
          <p className="text-sm text-[#020912]/70 whitespace-pre-wrap">{latestFeedback.adminFeedback}</p>
        </div>
      )}

      {/* Admin feedback banner - rejected */}
      {request.status === 'rejected' && latestFeedback?.adminFeedback && (
        <div className="p-4 bg-red-50 border border-red-200" role="alert">
          <h3 className="text-sm font-semibold text-red-700 mb-1">반려 사유</h3>
          <p className="text-sm text-red-700 whitespace-pre-wrap">{latestFeedback.adminFeedback}</p>
        </div>
      )}

      {/* Confirmed banner */}
      {request.status === 'confirmed' && (
        <div className="p-3 bg-[#dbe9e0]/50 border border-[#dbe9e0]">
          <p className="text-sm text-[#020912] font-medium">
            명함이 확정되었습니다. 아래에서 완성된 명함을 확인하세요.
          </p>
        </div>
      )}

      {/* Delivered banner */}
      {request.status === 'delivered' && (
        <div className="p-3 bg-[#e4f6ff]/50 border border-[#e4f6ff]">
          <p className="text-sm text-[#020912] font-medium">
            명함이 배송 완료되었습니다.
          </p>
        </div>
      )}

      {/* Cancelled banner */}
      {request.status === 'cancelled' && (
        <div className="p-3 bg-gray-50 border border-gray-200">
          <p className="text-sm text-[#020912]/60 font-medium">
            이 요청은 취소되었습니다.
          </p>
        </div>
      )}

      {/* Confirmed card preview */}
      {(request.status === 'confirmed' || request.status === 'delivered') && request.illustrationUrl && (
        <ConfirmedCardPreview
          card={request.card}
          illustrationUrl={request.illustrationUrl}
        />
      )}

      {/* Card info */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <h2 className="text-sm font-medium text-[#020912]/70 mb-3">카드 정보</h2>
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

      {/* User note */}
      {request.note && (
        <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
          <h2 className="text-sm font-medium text-[#020912]/70 mb-2">메모</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Image comparison */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
        <h2 className="text-sm font-medium text-[#020912]/70 mb-3">이미지 비교</h2>
        <CardCompare
          originalAvatarUrl={request.originalAvatarUrl}
          illustrationUrl={request.illustrationUrl}
          illustrationPreview={null}
        />
      </div>

      {/* Dates */}
      <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
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
        <div className="bg-white p-4 border border-[rgba(2,9,18,0.15)]">
          <StatusHistory history={request.statusHistory} />
        </div>
      )}

      {/* Cancel error */}
      {cancelError && (
        <div className="p-3 bg-red-50 border border-red-200" role="alert">
          <p className="text-sm text-red-700">{cancelError}</p>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="p-4 bg-[#ffa639]/10 border border-[#ffa639]/30">
          <p className="text-sm text-[#020912] font-medium mb-3">
            정말 취소하시겠습니까? 취소하면 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelLoading}
              className="px-4 py-2 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLoading ? '처리 중...' : '확인'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCancelConfirm(false);
                setCancelError(null);
              }}
              disabled={cancelLoading}
              className="px-4 py-2 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff] transition-colors min-h-[40px] disabled:opacity-50"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Edit / Cancel buttons */}
      {(isEditableStatus(request.status) || isCancellableStatus(request.status)) && !showCancelConfirm && (
        <div className="flex gap-3">
          {isEditableStatus(request.status) && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-6 py-2.5 text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/90 transition-colors min-h-[44px]"
            >
              편집
            </button>
          )}
          {isCancellableStatus(request.status) && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="px-6 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 hover:bg-red-50 transition-colors min-h-[44px]"
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  );
}
