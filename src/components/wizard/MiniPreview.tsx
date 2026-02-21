'use client';

import React from 'react';
import { CardFront } from '@/components/card/CardFront';
import { CardBack } from '@/components/card/CardBack';

export const MiniPreview = React.memo(function MiniPreview() {
  return (
    <section aria-label="Card preview">
      <h2 className="text-xs font-medium text-gray-500 mb-2">미리보기</h2>
      <div className="flex gap-3 justify-center">
        {/* Front card miniature - aspect-[29/45] at 240px = 372px height, scaled 0.5 = 186px */}
        <div className="w-[120px] h-[186px] overflow-hidden">
          <div
            style={{
              width: '240px',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
            }}
          >
            <CardFront />
          </div>
        </div>

        {/* Back card miniature */}
        <div className="w-[120px] h-[186px] overflow-hidden">
          <div
            style={{
              width: '240px',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
            }}
          >
            <CardBack />
          </div>
        </div>
      </div>
    </section>
  );
});
