'use client';

import { WizardContainer } from '@/components/wizard/WizardContainer';

export default function CreatePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            명함 만들기
          </h1>
        </div>

        <WizardContainer />
      </div>
    </main>
  );
}
