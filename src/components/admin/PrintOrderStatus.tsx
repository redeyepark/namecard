'use client';

import type { PrintOrder, PrintStatus } from '@/types/print-order';

const STATUS_CONFIG: Record<PrintStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: '초안', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending: { label: '대기중', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  production: { label: '제작중', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  shipped: { label: '배송중', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: '배송완료', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: '취소됨', color: 'text-red-700', bgColor: 'bg-red-100' },
  failed: { label: '실패', color: 'text-red-800', bgColor: 'bg-red-200' },
};

// Timeline steps in order
const STATUS_ORDER: PrintStatus[] = [
  'draft',
  'pending',
  'production',
  'shipped',
  'delivered',
];

interface PrintOrderStatusProps {
  order: PrintOrder;
}

/**
 * Print order status timeline display.
 * Shows status progression as a horizontal timeline with icons and colors.
 */
export function PrintOrderStatus({ order }: PrintOrderStatusProps) {
  const config = STATUS_CONFIG[order.status];
  const isCancelledOrFailed = order.status === 'cancelled' || order.status === 'failed';
  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
          {order.orderType === 'draft' && (
            <span className="text-xs text-[#020912]/40">(Draft)</span>
          )}
        </div>
        {order.trackingUrl && (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#ffa639] hover:text-[#e8952f] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            배송 추적
          </a>
        )}
      </div>

      {/* Timeline (only for non-cancelled/failed statuses) */}
      {!isCancelledOrFailed && (
        <div className="flex items-center gap-0">
          {STATUS_ORDER.map((step, idx) => {
            const stepConfig = STATUS_CONFIG[step];
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isActive = isCompleted || isCurrent;

            return (
              <div key={step} className="flex items-center flex-1">
                {/* Step dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      isCurrent
                        ? 'border-[#ffa639] bg-[#ffa639]'
                        : isCompleted
                          ? 'border-[#020912] bg-[#020912]'
                          : 'border-gray-300 bg-white'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 whitespace-nowrap ${
                      isActive ? 'text-[#020912] font-medium' : 'text-gray-400'
                    }`}
                  >
                    {stepConfig.label}
                  </span>
                </div>

                {/* Connector line (not after last step) */}
                {idx < STATUS_ORDER.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      isCompleted ? 'bg-[#020912]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tracking code */}
      {order.trackingCode && (
        <p className="text-xs text-[#020912]/50">
          운송장 번호: <span className="font-mono">{order.trackingCode}</span>
        </p>
      )}

      {/* Timestamps */}
      <div className="flex gap-4 text-xs text-[#020912]/40">
        <span>
          생성: {new Date(order.createdAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {order.updatedAt !== order.createdAt && (
          <span>
            수정: {new Date(order.updatedAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Print status badge component for use in tables and lists.
 */
export function PrintStatusBadge({ status }: { status: PrintStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}
