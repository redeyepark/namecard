'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { validateWizardStep } from '@/lib/validation';
import { ProgressBar } from '@/components/wizard/ProgressBar';
import { StepNavigation } from '@/components/wizard/StepNavigation';
import { MiniPreview } from '@/components/wizard/MiniPreview';
import { PersonalInfoStep } from '@/components/wizard/PersonalInfoStep';
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';
import { SocialTagStep } from '@/components/wizard/SocialTagStep';
import { PreviewStep } from '@/components/wizard/PreviewStep';
import { RequestSubmitStep } from '@/components/wizard/RequestSubmitStep';

export function WizardContainer() {
  const wizardStep = useCardStore((state) => state.wizardStep);
  const card = useCardStore((state) => state.card);
  const nextStep = useCardStore((state) => state.nextStep);
  const prevStep = useCardStore((state) => state.prevStep);

  const [showError, setShowError] = useState(false);

  const validation = validateWizardStep(wizardStep, card);
  const canProceed = validation.valid;

  // Show MiniPreview only on steps 1-3
  const showMiniPreview = wizardStep <= 3;

  // REQ-N-002: Warn user before leaving the page with unsaved progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (wizardStep > 1 && wizardStep < 5) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [wizardStep]);

  const handleNext = useCallback(() => {
    if (!canProceed) {
      setShowError(true);
      return;
    }
    setShowError(false);
    nextStep();
  }, [canProceed, nextStep]);

  const handlePrev = useCallback(() => {
    setShowError(false);
    prevStep();
  }, [prevStep]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <ProgressBar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile MiniPreview (above content) */}
        {showMiniPreview && (
          <div className="lg:hidden flex justify-center">
            <MiniPreview />
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div key={wizardStep} className="wizard-step-enter">
              {wizardStep === 1 && <PersonalInfoStep showError={showError} />}
              {wizardStep === 2 && <PhotoUploadStep />}
              {wizardStep === 3 && <SocialTagStep />}
              {wizardStep === 4 && <PreviewStep />}
              {wizardStep === 5 && <RequestSubmitStep />}
            </div>
          </div>

          {/* Step navigation */}
          <StepNavigation
            canProceed={canProceed}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </div>

        {/* Desktop MiniPreview (right sidebar) */}
        {showMiniPreview && (
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-8">
              <MiniPreview />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
