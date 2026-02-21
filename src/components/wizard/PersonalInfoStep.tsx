'use client';

import { useEffect, useRef } from 'react';
import { useCardStore } from '@/stores/useCardStore';

interface PersonalInfoStepProps {
  showError: boolean;
}

export function PersonalInfoStep({ showError }: PersonalInfoStepProps) {
  const card = useCardStore((state) => state.card);
  const updateFront = useCardStore((state) => state.updateFront);
  const updateBack = useCardStore((state) => state.updateBack);
  const displayNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus on display name input when step mounts
  useEffect(() => {
    displayNameRef.current?.focus();
  }, []);

  const displayName = card.front.displayName;
  const isDisplayNameEmpty = !displayName || displayName.trim() === '';
  const shouldShowError = showError && isDisplayNameEmpty;

  return (
    <section aria-label="Personal information">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보 입력</h2>

      <div className="space-y-4">
        {/* Display Name (required) */}
        <div>
          <label
            htmlFor="wizard-display-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            표시 이름 *
          </label>
          <input
            ref={displayNameRef}
            id="wizard-display-name"
            type="text"
            value={displayName}
            onChange={(e) => updateFront({ displayName: e.target.value })}
            maxLength={40}
            placeholder="명함에 표시될 이름"
            aria-required="true"
            aria-invalid={shouldShowError}
            aria-describedby={shouldShowError ? 'display-name-error' : undefined}
            className={`w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
              shouldShowError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {shouldShowError && (
            <p id="display-name-error" className="mt-1 text-sm text-red-600" role="alert">
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* Full Name (optional) */}
        <div>
          <label
            htmlFor="wizard-full-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            전체 이름
          </label>
          <input
            id="wizard-full-name"
            type="text"
            value={card.back.fullName}
            onChange={(e) => updateBack({ fullName: e.target.value })}
            maxLength={50}
            placeholder="실명 (선택 사항)"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>

        {/* Title / Role (optional) */}
        <div>
          <label
            htmlFor="wizard-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            직함 / 역할
          </label>
          <input
            id="wizard-title"
            type="text"
            value={card.back.title}
            onChange={(e) => updateBack({ title: e.target.value })}
            maxLength={80}
            placeholder="예: Software Engineer"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>
      </div>
    </section>
  );
}
