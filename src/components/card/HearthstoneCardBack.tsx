'use client';

import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getHearthstoneClassConfig } from './hearthstone-types';

/**
 * HearthstoneCardBack - Hearthstone card style back layout.
 * Stone border frame matching front, dark brown gradient interior,
 * decorative swirl pattern, centered name/title/hashtags, social links at bottom.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function HearthstoneCardBack() {
  const { back, hearthstoneMeta } = useCardData();
  const classConfig = getHearthstoneClassConfig(hearthstoneMeta?.classType ?? 'warrior');
  const classColor = classConfig.color;

  // Sort social links using the same platform order as other themes
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
        backgroundColor: '#3D2B1F',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Outer ornate stone border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: '8px solid #8B6914',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6), 0 0 4px rgba(139,105,20,0.5)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* Inner stone texture border */}
      <div
        style={{
          position: 'absolute',
          inset: '6px',
          borderRadius: '8px',
          border: '3px solid #6B5B3E',
          pointerEvents: 'none',
          zIndex: 19,
        }}
      />

      {/* Card inner content */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '6px',
          background: 'linear-gradient(180deg, #2A1F14 0%, #1A1210 50%, #0F0C0A 100%)',
        }}
      >
        {/* Decorative pattern overlay - Hearthstone swirl */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(139,105,20,0.8) 0%, transparent 50%), ' +
              'radial-gradient(ellipse at 50% 70%, rgba(139,105,20,0.6) 0%, transparent 45%), ' +
              'radial-gradient(circle at 25% 50%, rgba(139,105,20,0.4) 0%, transparent 40%), ' +
              'radial-gradient(circle at 75% 50%, rgba(139,105,20,0.4) 0%, transparent 40%), ' +
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Stone texture lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(139,105,20,0.3) 8px, rgba(139,105,20,0.3) 9px), ' +
              'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(139,105,20,0.3) 8px, rgba(139,105,20,0.3) 9px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top decorative class icon */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '20px',
            paddingBottom: '8px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Decorative shield/circle behind icon */}
          <div
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Outer ring */}
            <div
              style={{
                position: 'absolute',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid #8B6914',
                boxShadow: '0 0 12px rgba(139,105,20,0.3), inset 0 0 8px rgba(0,0,0,0.4)',
                background: 'radial-gradient(circle at 40% 40%, #3D2B1F, #1A1210)',
              }}
            />
            {/* Inner ring */}
            <div
              style={{
                position: 'absolute',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(139,105,20,0.5)',
              }}
            />
            {/* Class icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={classConfig.iconData.viewBox}
              style={{
                position: 'relative',
                width: '28px',
                height: '28px',
                fill: classColor,
                filter: `drop-shadow(0 0 4px ${classColor}40)`,
              }}
            >
              <path d={classConfig.iconData.path} />
            </svg>
          </div>
        </div>

        {/* Class label */}
        <div
          style={{
            flexShrink: 0,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: classColor,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {classConfig.name}
          </span>
        </div>

        {/* Decorative divider */}
        <div
          style={{
            flexShrink: 0,
            margin: '4px 24px 12px 24px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #8B6914, transparent)',
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            position: 'relative',
            zIndex: 1,
            minHeight: 0,
          }}
        >
          {/* Full name */}
          <h2
            title={back.fullName || 'FULL NAME'}
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#D4A76A',
              fontFamily: "'Nanum Myeongjo', serif",
              textAlign: 'center',
              margin: '0 0 6px 0',
              lineHeight: '1.3',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {renderMultiLine(back.fullName || 'FULL NAME')}
          </h2>

          {/* Title */}
          <p
            title={back.title || 'Your Title'}
            style={{
              fontSize: '13px',
              color: 'rgba(212,167,106,0.7)',
              fontFamily: "'Nanum Myeongjo', serif",
              textAlign: 'center',
              margin: '0 0 12px 0',
              lineHeight: '1.3',
            }}
          >
            {renderMultiLine(back.title || 'Your Title')}
          </p>

          {/* Hashtags */}
          {back.hashtags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'center',
                overflow: 'hidden',
                maxHeight: '3.5rem',
              }}
            >
              {back.hashtags.map((tag, i) => {
                const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: 'rgba(212,167,106,0.5)',
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

        {/* Bottom decorative divider */}
        <div
          style={{
            flexShrink: 0,
            margin: '0 24px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #8B6914, transparent)',
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Bottom social links */}
        {sortedLinks.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              padding: '8px 16px 12px 16px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {sortedLinks.map((link, i) => (
              <p
                key={i}
                style={{
                  fontSize: '10px',
                  color: 'rgba(212,167,106,0.5)',
                  lineHeight: '1.7',
                  fontFamily: "'Nanum Myeongjo', serif",
                  textAlign: 'right',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label ? `${link.label}${link.url ? ` ${extractHandle(link.url)}` : ''}` : extractHandle(link.url || '')}
              </p>
            ))}
          </div>
        )}

        {/* Bottom spacing when no social links */}
        {sortedLinks.length === 0 && (
          <div style={{ flexShrink: 0, height: '16px' }} />
        )}
      </div>
    </div>
  );
}
