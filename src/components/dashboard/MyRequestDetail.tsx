'use client';

import Link from 'next/link';
import type { CardRequest } from '@/types/request';
import { ProgressStepper } from './ProgressStepper';
import { ConfirmedCardPreview } from './ConfirmedCardPreview';
import { CardCompare } from '@/components/admin/CardCompare';
import { StatusHistory } from '@/components/admin/StatusHistory';

interface MyRequestDetailProps {
  request: CardRequest & {
    originalAvatarUrl: string | null;
    illustrationUrl: string | null;
  };
}

export function MyRequestDetail({ request }: MyRequestDetailProps) {
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
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-medium text-gray-700 mb-3">진행 상태</h2>
        <ProgressStepper currentStatus={request.status} />
      </div>

      {/* Confirmed banner */}
      {request.status === 'confirmed' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            명함이 확정되었습니다. 아래에서 완성된 명함을 확인하세요.
          </p>
        </div>
      )}

      {/* Confirmed card preview */}
      {request.status === 'confirmed' && request.illustrationUrl && (
        <ConfirmedCardPreview
          card={request.card}
          illustrationUrl={request.illustrationUrl}
        />
      )}

      {/* Card info */}
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

      {/* User note */}
      {request.note && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-2">메모</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Image comparison */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-medium text-gray-700 mb-3">이미지 비교</h2>
        <CardCompare
          originalAvatarUrl={request.originalAvatarUrl}
          illustrationUrl={request.illustrationUrl}
          illustrationPreview={null}
        />
      </div>

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
    </div>
  );
}
