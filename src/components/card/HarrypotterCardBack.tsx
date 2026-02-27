'use client';

import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getHarrypotterHouseConfig } from './harrypotter-types';

/**
 * HarrypotterCardBack - Harry Potter wizard card style back layout.
 * Ornate gold border matching front, deep dark gradient with house color tint,
 * large house crest icon, name/title/hashtags centered, social links at bottom.
 * Subtle magical constellation pattern overlay.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function HarrypotterCardBack() {
  const { back, harrypotterMeta } = useCardData();
  const houseConfig = getHarrypotterHouseConfig(harrypotterMeta?.house ?? 'gryffindor');
  const houseColor = houseConfig.color;
  const accentColor = houseConfig.accent;

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
        backgroundColor: '#1A1008',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Outer ornate gold border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: '8px solid #D4A76A',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6), 0 0 6px rgba(212,167,106,0.4)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* Inner gold border */}
      <div
        style={{
          position: 'absolute',
          inset: '6px',
          borderRadius: '8px',
          border: '2px solid #B8894E',
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
          background: `linear-gradient(180deg, ${houseColor}22 0%, #1A1008 40%, #0F0A04 100%)`,
        }}
      >
        {/* Magical constellation pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            background:
              'radial-gradient(circle at 20% 20%, rgba(212,167,106,0.8) 0%, transparent 2%), ' +
              'radial-gradient(circle at 80% 15%, rgba(212,167,106,0.6) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 50% 40%, rgba(212,167,106,0.5) 0%, transparent 1%), ' +
              'radial-gradient(circle at 30% 60%, rgba(212,167,106,0.7) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 70% 70%, rgba(212,167,106,0.6) 0%, transparent 2%), ' +
              'radial-gradient(circle at 15% 80%, rgba(212,167,106,0.5) 0%, transparent 1%), ' +
              'radial-gradient(circle at 85% 50%, rgba(212,167,106,0.4) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 45% 85%, rgba(212,167,106,0.6) 0%, transparent 1%), ' +
              'radial-gradient(circle at 60% 25%, rgba(212,167,106,0.5) 0%, transparent 1%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle magical shimmer lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            background:
              'repeating-linear-gradient(60deg, transparent, transparent 12px, rgba(212,167,106,0.2) 12px, rgba(212,167,106,0.2) 13px), ' +
              'repeating-linear-gradient(-60deg, transparent, transparent 12px, rgba(212,167,106,0.2) 12px, rgba(212,167,106,0.2) 13px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top center: Large house crest icon */}
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
            {/* Outer ring with glow */}
            <div
              style={{
                position: 'absolute',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid #D4A76A',
                boxShadow: `0 0 16px ${accentColor}44, inset 0 0 8px rgba(0,0,0,0.4)`,
                background: `radial-gradient(circle at 40% 40%, ${houseColor}88, ${houseColor} 70%, #000000)`,
              }}
            />
            {/* Inner ring */}
            <div
              style={{
                position: 'absolute',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(212,167,106,0.5)',
              }}
            />
            {/* House icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={houseConfig.iconData.viewBox}
              style={{
                position: 'relative',
                width: '28px',
                height: '28px',
                fill: accentColor,
                filter: `drop-shadow(0 0 4px ${accentColor}40)`,
              }}
            >
              <path d={houseConfig.iconData.path} />
            </svg>
          </div>
        </div>

        {/* House label */}
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
              color: accentColor,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {houseConfig.name}
          </span>
        </div>

        {/* Decorative gold divider */}
        <div
          style={{
            flexShrink: 0,
            margin: '4px 24px 12px 24px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #D4A76A, transparent)',
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
            background: 'linear-gradient(to right, transparent, #D4A76A, transparent)',
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
                {link.platform}/{extractHandle(link.url || link.label)}
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
