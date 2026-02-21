'use client';

import { useCardStore } from '@/stores/useCardStore';

const STEP_LABELS = ['정보', '사진', '소셜', '미리보기', '의뢰'];

export function ProgressBar() {
  const wizardStep = useCardStore((state) => state.wizardStep);
  const setWizardStep = useCardStore((state) => state.setWizardStep);

  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < wizardStep;
          const isCurrent = stepNumber === wizardStep;
          const isUpcoming = stepNumber > wizardStep;

          const ariaLabel = `Step ${stepNumber}: ${label} (${
            isCompleted ? '완료' : isCurrent ? '현재' : '예정'
          })`;

          return (
            <li key={stepNumber} className="flex items-center flex-1 last:flex-0">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) {
                      setWizardStep(stepNumber);
                    }
                  }}
                  disabled={isUpcoming || isCurrent}
                  aria-label={ariaLabel}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`
                    flex items-center justify-center rounded-full font-medium text-sm transition-all duration-200
                    ${isCurrent
                      ? 'w-10 h-10 bg-red-600 text-white ring-4 ring-red-100'
                      : isCompleted
                        ? 'w-9 h-9 bg-red-600 text-white cursor-pointer hover:bg-red-700'
                        : 'w-9 h-9 bg-gray-200 text-gray-400 cursor-default'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>

                {/* Step label */}
                <span
                  className={`mt-1.5 text-xs font-medium hidden min-[400px]:block ${
                    isCurrent
                      ? 'text-red-600'
                      : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {stepNumber < STEP_LABELS.length && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    stepNumber < wizardStep ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
