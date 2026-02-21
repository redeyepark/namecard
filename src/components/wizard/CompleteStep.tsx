'use client';

import { useCardStore } from '@/stores/useCardStore';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';
import { ExportButton } from '@/components/export/ExportButton';

export function CompleteStep() {
  const resetWizard = useCardStore((state) => state.resetWizard);

  return (
    <section aria-label="Completion">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          명함이 완성되었습니다!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          아래에서 완성된 명함을 확인하고 다운로드하세요.
        </p>
      </div>

      {/* Final preview - cards rendered for ExportButton to find by ID */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center sm:items-start mb-6">
        <div className="w-full max-w-[260px]">
          <p className="text-xs font-medium text-gray-500 mb-2 text-center">앞면</p>
          <CardFront />
        </div>
        <div className="w-full max-w-[260px]">
          <p className="text-xs font-medium text-gray-500 mb-2 text-center">뒷면</p>
          <CardBack />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-xs mx-auto">
        <ExportButton />
        <button
          type="button"
          onClick={resetWizard}
          className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          새 명함 만들기
        </button>
      </div>
    </section>
  );
}
