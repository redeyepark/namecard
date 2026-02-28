'use client';

import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';

/**
 * PokemonCardBack - Trading card style back layout with gold frame.
 * Matches the front card's thick gold border aesthetic.
 * Dark blue-to-purple gradient with decorative CSS pattern inside the frame.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function PokemonCardBack() {
  const { back } = useCardData();

  // Sort social links using the same platform order as classic card
  const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
  const sortedLinks = back.socialLinks
    .filter((link) => link.url || link.label)
    .sort((a, b) => {
      const aIdx = platformOrder.indexOf(a.platform);
      const bIdx = platformOrder.indexOf(b.platform);
      return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
    });

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[29/45] overflow-hidden"
      style={{
        borderRadius: '12px',
        backgroundColor: '#808080',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Thick gold border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: '10px solid #EED171',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Inner content area (inside the gold border) */}
      <div
        style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Double decorative inner border strip */}
        <div
          style={{
            flexShrink: 0,
            height: '4px',
            background: 'linear-gradient(to bottom, #736F6B 0%, #736F6B 50%, #E1DFDE 50%, #E1DFDE 100%)',
          }}
        />

        {/* Dark gradient content area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: 'linear-gradient(135deg, #1e3a5f, #4a1a6b)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Decorative CSS pattern overlay - concentric circles */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              background:
                'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%), ' +
                'radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 0%, transparent 45%), ' +
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%), ' +
                'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 40%), ' +
                'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />

          {/* Main content area */}
          <div
            className="relative flex-1 flex flex-col items-center justify-center px-4 py-6"
            style={{ zIndex: 1 }}
          >
            {/* Full name */}
            <h2
              className="font-bold text-center mb-1"
              title={back.fullName || 'FULL NAME'}
              style={{
                fontSize: '22px',
                color: '#FFFFFF',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              {renderMultiLine(back.fullName || 'FULL NAME')}
            </h2>

            {/* Title */}
            <p
              className="text-center mb-4"
              title={back.title || 'Your Title'}
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              {renderMultiLine(back.title || 'Your Title')}
            </p>

            {/* Hashtags */}
            {back.hashtags.length > 0 && (
              <div
                className="flex flex-wrap justify-center gap-1 overflow-hidden"
                style={{ maxHeight: '3.5rem' }}
              >
                {back.hashtags.map((tag, i) => {
                  const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontFamily: "'Nanum Myeongjo', serif",
                      }}
                    >
                      {renderMultiLine(tagText)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom social links */}
          {sortedLinks.length > 0 && (
            <div
              className="relative px-4 pb-3"
              style={{ zIndex: 1 }}
            >
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  paddingTop: '8px',
                }}
              >
                {sortedLinks.map((link, i) => (
                  <p
                    key={i}
                    className="truncate text-right"
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.6',
                      fontFamily: "'Nanum Myeongjo', serif",
                    }}
                  >
                    {link.label ? `${link.label}${link.url ? ` ${extractHandle(link.url)}` : ''}` : extractHandle(link.url || '')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
