'use client';

import { useCardStore } from '@/stores/useCardStore';

interface StepNavigationProps {
  canProceed: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export function StepNavigation({ canProceed, onNext, onPrev }: StepNavigationProps) {
  const wizardStep = useCardStore((state) => state.wizardStep);
  const nextStep = useCardStore((state) => state.nextStep);
  const prevStep = useCardStore((state) => state.prevStep);

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else {
      prevStep();
    }
  };

  // Hide navigation on Step 5 (complete)
  if (wizardStep === 5) {
    return null;
  }

  const isFirstStep = wizardStep === 1;
  const isLastContentStep = wizardStep === 4;

  return (
    <nav aria-label="Step navigation" className="flex justify-between items-center pt-4">
      {/* Previous button */}
      {isFirstStep ? (
        <div />
      ) : (
        <button
          type="button"
          onClick={handlePrev}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          이전
        </button>
      )}

      {/* Next / Complete button */}
      <button
        type="button"
        onClick={handleNext}
        className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors min-h-[44px] ${
          canProceed
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-red-400 hover:bg-red-500'
        }`}
      >
        {isLastContentStep ? '완료' : '다음'}
      </button>
    </nav>
  );
}
