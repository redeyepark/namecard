'use client';

import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getTarotArcanaConfig } from './tarot-types';

/**
 * TarotCardBack - Mystical tarot card style back layout.
 * Ornate art nouveau border matching front, deep dark gradient with arcana color tint,
 * large arcana icon in ornate circular frame, arcana label, gold dividers,
 * name/title/hashtags centered, social links at bottom, celestial star pattern overlay.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function TarotCardBack() {
  const { back, tarotMeta } = useCardData();
  const arcanaConfig = getTarotArcanaConfig(tarotMeta?.arcana ?? 'major');
  const arcanaColor = arcanaConfig.color;
  const accentColor = arcanaConfig.accent;

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
        backgroundColor: '#0D0B1A',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Outer ornate border - arcana colored */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: `6px solid ${arcanaColor}`,
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.7), 0 0 8px ${accentColor}33`,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* Inner gold accent border */}
      <div
        style={{
          position: 'absolute',
          inset: '4px',
          borderRadius: '9px',
          border: `2px solid ${accentColor}88`,
          pointerEvents: 'none',
          zIndex: 19,
        }}
      />

      {/* Inner decorative border */}
      <div
        style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '6px',
          border: `1px solid ${accentColor}44`,
          pointerEvents: 'none',
          zIndex: 18,
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
          borderRadius: '5px',
          background: `linear-gradient(180deg, ${arcanaColor}33 0%, #0D0B1A 40%, #08061A 100%)`,
        }}
      >
        {/* Celestial star pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            background:
              'radial-gradient(circle at 20% 15%, rgba(255,215,0,0.8) 0%, transparent 2%), ' +
              'radial-gradient(circle at 80% 10%, rgba(255,215,0,0.6) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 50% 35%, rgba(255,215,0,0.5) 0%, transparent 1%), ' +
              'radial-gradient(circle at 30% 55%, rgba(255,215,0,0.7) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 70% 65%, rgba(255,215,0,0.6) 0%, transparent 2%), ' +
              'radial-gradient(circle at 15% 75%, rgba(255,215,0,0.5) 0%, transparent 1%), ' +
              'radial-gradient(circle at 85% 45%, rgba(255,215,0,0.4) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 45% 85%, rgba(255,215,0,0.6) 0%, transparent 1%), ' +
              'radial-gradient(circle at 60% 20%, rgba(255,215,0,0.5) 0%, transparent 1%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle mystical lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            background:
              'repeating-linear-gradient(60deg, transparent, transparent 14px, rgba(255,215,0,0.2) 14px, rgba(255,215,0,0.2) 15px), ' +
              'repeating-linear-gradient(-60deg, transparent, transparent 14px, rgba(255,215,0,0.2) 14px, rgba(255,215,0,0.2) 15px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top center: Large arcana icon in ornate circular frame */}
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
                border: `3px solid ${accentColor}`,
                boxShadow: `0 0 20px ${accentColor}44, inset 0 0 10px rgba(0,0,0,0.5)`,
                background: `radial-gradient(circle at 40% 40%, ${arcanaColor}aa, ${arcanaColor} 70%, #000000)`,
              }}
            />
            {/* Inner ring */}
            <div
              style={{
                position: 'absolute',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: `1px solid ${accentColor}66`,
              }}
            />
            {/* Arcana icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={arcanaConfig.iconData.viewBox}
              style={{
                position: 'relative',
                width: '28px',
                height: '28px',
                fill: accentColor,
                filter: `drop-shadow(0 0 6px ${accentColor}55)`,
              }}
            >
              <path d={arcanaConfig.iconData.path} />
            </svg>
          </div>
        </div>

        {/* Arcana label */}
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
            {arcanaConfig.name}
          </span>
        </div>

        {/* Decorative gold divider */}
        <div
          style={{
            flexShrink: 0,
            margin: '4px 24px 12px 24px',
            height: '1px',
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
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
              color: accentColor,
              fontFamily: "'Nanum Myeongjo', serif",
              textAlign: 'center',
              margin: '0 0 6px 0',
              lineHeight: '1.3',
              textShadow: `0 1px 4px rgba(0,0,0,0.6), 0 0 8px ${accentColor}33`,
            }}
          >
            {renderMultiLine(back.fullName || 'FULL NAME')}
          </h2>

          {/* Title */}
          <p
            title={back.title || 'Your Title'}
            style={{
              fontSize: '13px',
              color: `${accentColor}aa`,
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
                      color: `${accentColor}66`,
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
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
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
                  color: `${accentColor}66`,
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
