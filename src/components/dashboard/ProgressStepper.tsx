'use client';

import type { RequestStatus } from '@/types/request';

interface ProgressStepperProps {
  currentStatus: RequestStatus;
}

const STEPS: { key: RequestStatus; label: string; color: string; bgColor: string }[] = [
  { key: 'submitted', label: '의뢰됨', color: 'text-blue-600', bgColor: 'bg-blue-600' },
  { key: 'processing', label: '작업중', color: 'text-amber-600', bgColor: 'bg-amber-600' },
  { key: 'confirmed', label: '확정', color: 'text-green-600', bgColor: 'bg-green-600' },
];

function getStepIndex(status: RequestStatus): number {
  return STEPS.findIndex((s) => s.key === status);
}

export function ProgressStepper({ currentStatus }: ProgressStepperProps) {
  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="flex items-center w-full" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={3} aria-label={`진행 상태: ${STEPS[currentIndex].label}`}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {isCompleted && (
                  <div className={`w-7 h-7 rounded-full ${step.bgColor} flex items-center justify-center`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                {isCurrent && (
                  <div className="relative">
                    <div className={`w-7 h-7 rounded-full ${step.bgColor} flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <div className={`absolute inset-0 w-7 h-7 rounded-full ${step.bgColor} opacity-30 animate-ping`} />
                  </div>
                )}
                {isFuture && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">{index + 1}</span>
                  </div>
                )}
              </div>
              <span className={`mt-1.5 text-[10px] font-medium ${isFuture ? 'text-gray-400' : step.color}`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-2">
                <div className={`h-0.5 w-full ${index < currentIndex ? STEPS[index + 1].bgColor : 'bg-gray-200'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
