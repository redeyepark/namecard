'use client';

import { useCardStore } from '@/stores/useCardStore';

export function CardFront() {
  const { front } = useCardStore((state) => state.card);

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[3/4] rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: front.backgroundColor }}
    >
      <div className="p-4 sm:p-6 pt-6 sm:pt-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-white tracking-wide truncate"
          title={front.displayName || 'YOUR NAME'}
        >
          {front.displayName || 'YOUR NAME'}
        </h1>
      </div>
      <div className="flex-1 flex items-end justify-center px-4 pb-4">
        {front.avatarImage ? (
          <img
            src={front.avatarImage}
            alt="Avatar"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-36 h-36 sm:w-48 sm:h-48 bg-black/10 rounded-full flex items-center justify-center">
            <span className="text-white/50 text-xs sm:text-sm">Upload Image</span>
          </div>
        )}
      </div>
    </div>
  );
}
