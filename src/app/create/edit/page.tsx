'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CardPreview } from '@/components/card/CardPreview';
import { TabSwitch } from '@/components/ui/TabSwitch';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { ExportButton } from '@/components/export/ExportButton';
import { ResetButton } from '@/components/ui/ResetButton';

export default function EditPage() {
  // TEMPORARY: Card creation is temporarily disabled. Remove this line to re-enable.
  redirect('/dashboard');
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-4">
          <Link
            href="/create"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; 위저드로 돌아가기
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Namecard Editor
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Create and customize your personal business card
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile/Tablet: Preview first for immediate visual feedback */}
          <div className="lg:hidden">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Preview</h2>
            <div className="flex justify-center">
              <div className="w-full max-w-[240px] sm:max-w-[280px]">
                <CardPreview />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-w-0 space-y-4">
            <TabSwitch />
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <EditorPanel />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <ExportButton />
              </div>
              <ResetButton />
            </div>
          </div>

          {/* Desktop: Preview on right, sticky */}
          <div className="hidden lg:block lg:w-80 shrink-0">
            <div className="sticky top-8">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Preview</h2>
              <CardPreview />
              <div className="mt-4">
                <ExportButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
