'use client';

import { useCardStore } from '@/stores/useCardStore';
import { extractHandle } from '@/lib/social-utils';

export function CardBack() {
  const { back } = useCardStore((state) => state.card);

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[29/45] overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor: back.backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Upper area (~80%): Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="text-[30px] font-bold mb-1 truncate"
          title={back.fullName || 'FULL NAME'}
          style={{ color: back.textColor || '#000000' }}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
        <p
          className="text-[20px] mb-4 line-clamp-2"
          title={back.title || 'Your Title'}
          style={{ color: back.textColor || '#000000', opacity: 0.9 }}
        >
          {back.title || 'Your Title'}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[4.5rem]">
          {back.hashtags.map((tag, i) => (
            <span
              key={i}
              className="font-medium text-[20px]"
              style={{ color: back.textColor || '#000000' }}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom area (~20%): Social links */}
      {(() => {
        const platformOrder = ['email', 'linkedin', 'instagram', 'facebook'];
        const sortedLinks = back.socialLinks
          .filter((link) => link.url || link.label)
          .sort((a, b) => {
            const aIdx = platformOrder.indexOf(a.platform);
            const bIdx = platformOrder.indexOf(b.platform);
            return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
          });
        return sortedLinks.length > 0 ? (
          <div className="mt-2">
            {sortedLinks.map((link, i) => (
              <p
                key={i}
                className="text-xs py-1.5 truncate text-right"
                style={{ color: back.textColor || '#000000', opacity: 0.8 }}
              >
                {link.platform}/{extractHandle(link.url || link.label)}
              </p>
            ))}
          </div>
        ) : null;
      })()}
    </div>
  );
}
