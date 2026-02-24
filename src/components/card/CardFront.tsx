'use client';

import { useCardStore } from '@/stores/useCardStore';

export function CardFront() {
  const { front } = useCardStore((state) => state.card);

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[29/45] overflow-hidden"
      style={{ backgroundColor: front.backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Layer 2: Illustration image - full card cover */}
      {front.avatarImage ? (
        <img
          src={front.avatarImage}
          alt="Illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black/5 flex items-center justify-center">
          <span className="text-black/30 text-xs sm:text-sm">Upload Image</span>
        </div>
      )}

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-wide truncate"
          title={front.displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: (front.textColor || '#FFFFFF').toUpperCase() === '#FFFFFF'
              ? '1px rgba(0, 0, 0, 0.8)'
              : '1px rgba(255, 255, 255, 0.6)',
            color: front.textColor || '#FFFFFF',
            paintOrder: 'stroke fill',
            fontFamily: "'Nanum Myeongjo', serif",
          }}
        >
          {front.displayName || 'YOUR NAME'}
        </h1>
      </div>
    </div>
  );
}
