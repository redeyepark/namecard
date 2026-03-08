'use client';

import type { RequestStatus } from '@/types/request';

interface ProgressStepperProps {
  currentStatus: RequestStatus;
}

interface StepConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

const BASE_STEPS: StepConfig[] = [
  { key: 'submitted', label: '의뢰됨', color: 'text-primary', bgColor: 'bg-primary' },
  { key: 'processing', label: '작업중', color: 'text-primary/70', bgColor: 'bg-primary' },
  { key: 'confirmed', label: '확정', color: 'text-primary', bgColor: 'bg-primary' },
];

const DELIVERED_STEP: StepConfig = {
  key: 'delivered',
  label: '배송 완료',
  color: 'text-primary',
  bgColor: 'bg-primary',
};

function getStepsForStatus(status: RequestStatus): StepConfig[] {
  if (status === 'delivered') {
    return [...BASE_STEPS, DELIVERED_STEP];
  }
  return BASE_STEPS;
}

function getActiveIndex(status: RequestStatus): number {
  switch (status) {
    case 'submitted':
    case 'revision_requested':
      return 0;
    case 'processing':
      return 1;
    case 'confirmed':
    case 'rejected':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

export function ProgressStepper({ currentStatus }: ProgressStepperProps) {
  const isRejected = currentStatus === 'rejected';
  const isCancelled = currentStatus === 'cancelled';
  const isRevisionRequested = currentStatus === 'revision_requested';

  const steps = getStepsForStatus(currentStatus);
  const currentIndex = getActiveIndex(currentStatus);

  return (
    <div>
      <div
        className="flex items-center w-full"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`진행 상태: ${isCancelled ? '취소됨' : isRejected ? '반려' : isRevisionRequested ? '수정 요청' : steps[currentIndex]?.label ?? ''}`}
      >
        {steps.map((step, index) => {
          // Determine step visual state
          let isCompleted = false;
          let isCurrent = false;
          let isFuture = false;

          if (isCancelled) {
            // All steps shown as grey/cancelled
            isFuture = true;
          } else if (isRejected) {
            // All steps shown as red/failed
            isCurrent = false;
            isCompleted = false;
            isFuture = false;
          } else {
            isCompleted = index < currentIndex;
            isCurrent = index === currentIndex;
            isFuture = index > currentIndex;
          }

          // Override colors for special statuses
          let circleBg = step.bgColor;
          let labelColor = step.color;

          if (isRejected) {
            circleBg = 'bg-error';
            labelColor = 'text-error';
          } else if (isCancelled) {
            circleBg = 'bg-text-tertiary';
            labelColor = 'text-text-tertiary';
          } else if (isRevisionRequested && index === 0) {
            circleBg = 'bg-accent-orange';
            labelColor = 'text-accent-orange';
          }

          // Override label for special statuses
          let displayLabel = step.label;
          if (isRejected && index === steps.length - 1) {
            displayLabel = '반려';
          } else if (isCancelled && index === steps.length - 1) {
            displayLabel = '취소됨';
          } else if (isRevisionRequested && index === 0) {
            displayLabel = '수정 요청';
          }

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {/* Cancelled: all grey */}
                  {isCancelled && (
                    <div className="w-7 h-7 rounded-full bg-text-tertiary flex items-center justify-center">
                      {index === steps.length - 1 ? (
                        <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold text-text-secondary">{index + 1}</span>
                      )}
                    </div>
                  )}

                  {/* Rejected: all red */}
                  {isRejected && (
                    <div className={`w-7 h-7 rounded-full ${circleBg} flex items-center justify-center`}>
                      {index === steps.length - 1 ? (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      )}
                    </div>
                  )}

                  {/* Normal flow */}
                  {!isCancelled && !isRejected && (
                    <>
                      {isCompleted && (
                        <div className={`w-7 h-7 rounded-full ${circleBg} flex items-center justify-center`}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="relative">
                          <div className={`w-7 h-7 rounded-full ${circleBg} flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                          <div className={`absolute inset-0 w-7 h-7 rounded-full ${circleBg} opacity-30 animate-ping`} />
                        </div>
                      )}
                      {isFuture && (
                        <div className="w-7 h-7 rounded-full bg-border-light flex items-center justify-center">
                          <span className="text-xs font-bold text-text-tertiary">{index + 1}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span className={`mt-1.5 text-[10px] font-medium ${isCancelled ? 'text-text-tertiary' : isRejected ? labelColor : isFuture ? 'text-text-tertiary' : labelColor}`}>
                  {displayLabel}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={`h-0.5 w-full ${
                      isCancelled
                        ? 'bg-border-light'
                        : isRejected
                          ? 'bg-error/30'
                          : index < currentIndex
                            ? steps[index + 1]
                              ? (isRevisionRequested && index === 0 ? 'bg-accent-orange/50' : steps[index + 1].bgColor)
                              : 'bg-border-light'
                            : 'bg-border-light'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status note below stepper */}
      {isRevisionRequested && (
        <p className="mt-2 text-xs text-accent-orange text-center font-medium">
          관리자가 수정을 요청했습니다. 내용을 수정 후 다시 제출해주세요.
        </p>
      )}
    </div>
  );
}
