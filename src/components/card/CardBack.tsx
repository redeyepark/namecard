'use client';

import { useCardStore } from '@/stores/useCardStore';

export function CardBack() {
  const { back } = useCardStore((state) => state.card);

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[3/4] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: back.backgroundColor }}
    >
      <div className="flex-1 min-h-0">
        <h2
          className="text-lg sm:text-xl font-bold text-white mb-1 truncate"
          title={back.fullName || 'FULL NAME'}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-white/90 text-xs sm:text-sm mb-4 line-clamp-2"
          title={back.title || 'Your Title'}
        >
          {back.title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {back.hashtags.map((tag, i) => (
            <span key={i} className="text-white font-medium text-xs sm:text-sm">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
      {back.socialLinks.length > 0 && (
        <div className="text-right space-y-0.5 mt-2 overflow-hidden max-h-[4rem]">
          {back.socialLinks.map((link, i) => (
            <p key={i} className="text-white/80 text-xs italic truncate">
              {link.label || link.url}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
