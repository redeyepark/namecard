'use client';

import Link from 'next/link';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';

export function PreviewStep() {
  return (
    <section aria-label="Card preview">
      <h2 className="text-lg font-semibold text-primary mb-4">미리보기</h2>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center sm:items-start">
        {/* Front card */}
        <div className="w-full max-w-[280px]">
          <p className="text-xs font-medium text-text-secondary mb-2 text-center">앞면</p>
          <CardFront />
        </div>

        {/* Back card */}
        <div className="w-full max-w-[280px]">
          <p className="text-xs font-medium text-text-secondary mb-2 text-center">뒷면</p>
          <CardBack />
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/create/edit"
          className="inline-block px-5 py-2.5 text-sm font-medium text-text-primary bg-surface border border-border-medium rounded-lg hover:bg-bg transition-colors min-h-[44px] leading-[28px]"
        >
          상세 편집
        </Link>
      </div>
    </section>
  );
}
