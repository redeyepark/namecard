'use client';

import { useCardStore } from '@/stores/useCardStore';

export function CardBack() {
  const { back } = useCardStore((state) => state.card);

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: back.backgroundColor }}
    >
      {/* Upper area (~80%): Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="text-lg sm:text-xl font-bold text-black mb-1 truncate"
          title={back.fullName || 'FULL NAME'}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-black/90 text-xs sm:text-sm mb-4 line-clamp-2"
          title={back.title || 'Your Title'}
        >
          {back.title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {back.hashtags.map((tag, i) => (
            <span key={i} className="text-black font-medium text-xs sm:text-sm">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom area (~20%): Social links with horizontal dividers */}
      {back.socialLinks.length > 0 && (
        <div className="mt-2">
          {back.socialLinks.map((link, i) => (
            <div key={i}>
              <div className="border-t border-black/30" />
              <p className="text-black/80 text-xs py-1.5 truncate text-left">
                {link.label || link.url}
              </p>
            </div>
          ))}
          {/* Final bottom divider */}
          <div className="border-t border-black/30" />
        </div>
      )}
    </div>
  );
}
