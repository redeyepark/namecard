'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { CardRequest } from '@/types/request';
import { isEditableStatus, isCancellableStatus } from '@/types/request';
import { Button } from '@/components/ui';
import { ProgressStepper } from './ProgressStepper';
import { ConfirmedCardPreview } from './ConfirmedCardPreview';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { CardCompare } from '@/components/admin/CardCompare';
import { StatusHistory } from '@/components/admin/StatusHistory';
import { VisibilityToggle } from '@/components/visibility/VisibilityToggle';
import { ShareUrlDisplay } from '@/components/visibility/ShareUrlDisplay';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

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

  const handleConfirm = useCallback(async () => {
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const res = await fetch(`/api/requests/my/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '확정에 실패했습니다.');
      }
      setShowConfirmDialog(false);
      onRefresh?.();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : '확정에 실패했습니다.');
    } finally {
      setConfirmLoading(false);
    }
  }, [request.id, onRefresh]);

  const canToggleVisibility = request.status === 'confirmed' || request.status === 'delivered';
  const shareUrl = request.isPublic
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cards/${request.id}`
    : null;

  const handleVisibilityToggle = useCallback(async (isPublic: boolean) => {
    setVisibilityLoading(true);
    try {
      const res = await fetch(`/api/requests/my/${request.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '공개 설정 변경에 실패했습니다.');
      }
      onRefresh?.();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : '공개 설정 변경에 실패했습니다.');
    } finally {
      setVisibilityLoading(false);
    }
  }, [request.id, onRefresh]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-primary/60 hover:text-accent-orange transition-colors"
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
      <div className="bg-surface p-4 border border-border-medium">
        <h2 className="text-sm font-medium text-primary/70 mb-3">진행 상태</h2>
        <ProgressStepper currentStatus={request.status} />
      </div>

      {/* Admin feedback banner - revision_requested */}
      {request.status === 'revision_requested' && latestFeedback?.adminFeedback && (
        <div className="p-4 bg-accent-peach/50 border border-accent-orange/30" role="alert">
          <h3 className="text-sm font-semibold text-primary mb-1">관리자 수정 요청</h3>
          <p className="text-sm text-primary/70 whitespace-pre-wrap">{latestFeedback.adminFeedback}</p>
        </div>
      )}

      {/* Admin feedback banner - rejected */}
      {request.status === 'rejected' && latestFeedback?.adminFeedback && (
        <div className="p-4 bg-error/5 border border-error/20" role="alert">
          <h3 className="text-sm font-semibold text-error mb-1">반려 사유</h3>
          <p className="text-sm text-error whitespace-pre-wrap">{latestFeedback.adminFeedback}</p>
        </div>
      )}

      {/* Confirmed banner */}
      {request.status === 'confirmed' && (
        <div className="p-3 bg-accent-green/50 border border-accent-green">
          <p className="text-sm text-primary font-medium">
            명함이 확정되었습니다. 아래에서 완성된 명함을 확인하세요.
          </p>
        </div>
      )}

      {/* Delivered banner */}
      {request.status === 'delivered' && (
        <div className="p-3 bg-accent-blue/50 border border-accent-blue">
          <p className="text-sm text-primary font-medium">
            명함이 배송 완료되었습니다.
          </p>
        </div>
      )}

      {/* Visibility toggle - shown for confirmed/delivered cards */}
      {(request.status === 'confirmed' || request.status === 'delivered') && (
        <div className="bg-surface p-4 border border-border-medium">
          <h2 className="text-sm font-medium text-primary/70 mb-3">공개 설정</h2>
          <VisibilityToggle
            isPublic={request.isPublic}
            disabled={!canToggleVisibility || visibilityLoading}
            disabledReason={!canToggleVisibility ? '확정 또는 배송 완료된 명함만 공개할 수 있습니다.' : undefined}
            onToggle={handleVisibilityToggle}
          />
          {shareUrl && (
            <ShareUrlDisplay url={shareUrl} isVisible={request.isPublic} />
          )}
        </div>
      )}

      {/* Cancelled banner */}
      {request.status === 'cancelled' && (
        <div className="p-3 bg-bg border border-divider">
          <p className="text-sm text-primary/60 font-medium">
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

      {/* Card preview for all other cases (non-confirmed, or confirmed/delivered without illustration) */}
      {!((request.status === 'confirmed' || request.status === 'delivered') && request.illustrationUrl) && (
        <div className="bg-surface p-4 border border-border-medium">
          <h2 className="text-sm font-medium text-primary/70 mb-3">명함 미리보기</h2>
          <AdminCardPreview
            card={request.card}
            illustrationUrl={request.illustrationUrl}
          />
        </div>
      )}

      {/* Card info */}
      <div className="bg-surface p-4 border border-border-medium">
        <h2 className="text-sm font-medium text-primary/70 mb-3">카드 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-secondary">표시 이름</span>
            <p className="font-medium text-text-primary">{request.card.front.displayName}</p>
          </div>
          <div>
            <span className="text-text-secondary">전체 이름</span>
            <p className="font-medium text-text-primary">{request.card.back.fullName}</p>
          </div>
          <div>
            <span className="text-text-secondary">직함</span>
            <p className="font-medium text-text-primary">{request.card.back.title || '-'}</p>
          </div>
          <div>
            <span className="text-text-secondary">해시태그</span>
            <p className="font-medium text-text-primary">
              {request.card.back.hashtags.length > 0
                ? request.card.back.hashtags.join(', ')
                : '-'}
            </p>
          </div>
          {request.card.back.socialLinks.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-text-secondary">소셜 링크</span>
              <div className="mt-1 space-y-1">
                {request.card.back.socialLinks.map((link, i) => (
                  <p key={i} className="text-text-primary text-xs">
                    <span className="font-medium">{link.platform}</span>: {link.url}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-text-secondary">앞면 배경색</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded border border-divider"
                style={{ backgroundColor: request.card.front.backgroundColor }}
              />
              <span className="text-xs font-mono text-text-secondary">
                {request.card.front.backgroundColor}
              </span>
            </div>
          </div>
          <div>
            <span className="text-text-secondary">뒷면 배경색</span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded border border-divider"
                style={{ backgroundColor: request.card.back.backgroundColor }}
              />
              <span className="text-xs font-mono text-text-secondary">
                {request.card.back.backgroundColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User note */}
      {request.note && (
        <div className="bg-surface p-4 border border-border-medium">
          <h2 className="text-sm font-medium text-primary/70 mb-2">메모</h2>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Image comparison */}
      <div className="bg-surface p-4 border border-border-medium">
        <h2 className="text-sm font-medium text-primary/70 mb-3">이미지 비교</h2>
        <CardCompare
          originalAvatarUrl={request.originalAvatarUrl}
          illustrationUrl={request.illustrationUrl}
          illustrationPreview={null}
        />
      </div>

      {/* Dates */}
      <div className="bg-surface p-4 border border-border-medium">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-secondary">제출일</span>
            <p className="text-text-primary">{submittedDate}</p>
          </div>
          <div>
            <span className="text-text-secondary">최종 수정일</span>
            <p className="text-text-primary">{updatedDate}</p>
          </div>
        </div>
      </div>

      {/* Status history */}
      {request.statusHistory.length > 0 && (
        <div className="bg-surface p-4 border border-border-medium">
          <StatusHistory history={request.statusHistory} />
        </div>
      )}

      {/* Cancel error */}
      {cancelError && (
        <div className="p-3 bg-error/5 border border-error/20" role="alert">
          <p className="text-sm text-error">{cancelError}</p>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirmDialog && (
        <div className="p-4 bg-accent-green/50 border border-success/30">
          <p className="text-sm text-primary font-medium mb-3">
            명함 정보를 확정하시겠습니까? 확정 후에는 수정이 불가합니다.
          </p>
          {confirmError && (
            <p className="text-sm text-error mb-3">{confirmError}</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={confirmLoading}
              className="bg-success hover:bg-success/90 min-h-[40px]"
            >
              {confirmLoading ? '처리 중...' : '확정'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => { setShowConfirmDialog(false); setConfirmError(null); }}
              disabled={confirmLoading}
              className="hover:bg-accent-blue min-h-[40px]"
            >
              돌아가기
            </Button>
          </div>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="p-4 bg-accent-orange/10 border border-accent-orange/30">
          <p className="text-sm text-primary font-medium mb-3">
            정말 취소하시겠습니까? 취소하면 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCancel}
              disabled={cancelLoading}
              className="min-h-[40px]"
            >
              {cancelLoading ? '처리 중...' : '확인'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setShowCancelConfirm(false);
                setCancelError(null);
              }}
              disabled={cancelLoading}
              className="hover:bg-accent-blue min-h-[40px]"
            >
              돌아가기
            </Button>
          </div>
        </div>
      )}

      {/* Edit / Confirm / Cancel buttons */}
      {(isEditableStatus(request.status) || isCancellableStatus(request.status)) && !showCancelConfirm && !showConfirmDialog && (
        <div className="flex gap-3">
          {isEditableStatus(request.status) && onEdit && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onEdit}
              className="min-h-[44px]"
            >
              편집
            </Button>
          )}
          {isEditableStatus(request.status) && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setShowConfirmDialog(true)}
              className="bg-success hover:bg-success/90 min-h-[44px]"
            >
              확정
            </Button>
          )}
          {isCancellableStatus(request.status) && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={() => setShowCancelConfirm(true)}
              className="bg-surface text-error border border-error/30 hover:bg-error/5 min-h-[44px]"
            >
              취소
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
