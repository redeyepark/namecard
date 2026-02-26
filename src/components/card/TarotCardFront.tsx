'use client';

import { useCardStore } from '@/stores/useCardStore';
import { renderMultiLine } from '@/lib/text-utils';
import { getTarotArcanaConfig } from './tarot-types';

/**
 * TarotCardFront - Mystical tarot card style front layout.
 * Ornate art nouveau double border with arcana-colored accent, celestial pattern overlay,
 * portrait with ornate arch frame, name banner with arcana color,
 * card number badge top-left, arcana type badge top-right, mystique badge bottom-right.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function TarotCardFront() {
  const { front, back, tarotMeta } = useCardStore((state) => state.card);
  const arcanaConfig = getTarotArcanaConfig(tarotMeta?.arcana ?? 'major');
  const cardNumber = tarotMeta?.cardNumber ?? 0;
  const mystique = tarotMeta?.mystique ?? 100;
  const arcanaColor = arcanaConfig.color;
  const accentColor = arcanaConfig.accent;

  return (
    <div
      id="card-front"
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

      {/* Inner gold accent border (double border effect) */}
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
          background: `linear-gradient(180deg, ${arcanaColor}33 0%, #0D0B1A 25%, #08061A 100%)`,
        }}
      >
        {/* Celestial star pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            background:
              'radial-gradient(circle at 15% 10%, rgba(255,215,0,0.9) 0%, transparent 2%), ' +
              'radial-gradient(circle at 75% 8%, rgba(255,215,0,0.7) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 45% 20%, rgba(255,215,0,0.5) 0%, transparent 1%), ' +
              'radial-gradient(circle at 85% 30%, rgba(255,215,0,0.6) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 25% 45%, rgba(255,215,0,0.4) 0%, transparent 1%), ' +
              'radial-gradient(circle at 60% 55%, rgba(255,215,0,0.5) 0%, transparent 2%), ' +
              'radial-gradient(circle at 10% 70%, rgba(255,215,0,0.6) 0%, transparent 1%), ' +
              'radial-gradient(circle at 90% 65%, rgba(255,215,0,0.7) 0%, transparent 1.5%), ' +
              'radial-gradient(circle at 35% 80%, rgba(255,215,0,0.4) 0%, transparent 1%), ' +
              'radial-gradient(circle at 70% 90%, rgba(255,215,0,0.5) 0%, transparent 1.5%)',
            pointerEvents: 'none',
          }}
        />

        {/* Portrait area (~55% height) with ornate arch frame */}
        <div
          style={{
            flex: '1 1 55%',
            position: 'relative',
            minHeight: 0,
            margin: '8px 8px 0 8px',
            borderRadius: '50% 50% 4px 4px / 20% 20% 4px 4px',
            overflow: 'hidden',
            border: `3px solid ${accentColor}99`,
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.6), 0 0 10px ${accentColor}22`,
          }}
        >
          {front.avatarImage ? (
            <img
              src={front.avatarImage}
              alt="Portrait"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${arcanaColor}55, #0D0B1A)`,
              }}
            >
              <span
                style={{
                  color: accentColor,
                  fontSize: '12px',
                  fontFamily: "'Nanum Myeongjo', serif",
                  opacity: 0.6,
                }}
              >
                Upload Image
              </span>
            </div>
          )}

          {/* Mystical vignette overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: `inset 0 0 40px rgba(0,0,0,0.5), inset 0 0 80px ${arcanaColor}33`,
            }}
          />

          {/* Corner flourishes - art nouveau */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              width: '18px',
              height: '18px',
              borderTop: `2px solid ${accentColor}88`,
              borderLeft: `2px solid ${accentColor}88`,
              borderRadius: '4px 0 0 0',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '18px',
              height: '18px',
              borderTop: `2px solid ${accentColor}88`,
              borderRight: `2px solid ${accentColor}88`,
              borderRadius: '0 4px 0 0',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              width: '18px',
              height: '18px',
              borderBottom: `2px solid ${accentColor}88`,
              borderLeft: `2px solid ${accentColor}88`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '18px',
              height: '18px',
              borderBottom: `2px solid ${accentColor}88`,
              borderRight: `2px solid ${accentColor}88`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Name banner - arcana colored */}
        <div
          style={{
            flexShrink: 0,
            margin: '0 4px',
            padding: '6px 12px',
            background: `linear-gradient(180deg, ${arcanaColor}dd 0%, ${arcanaColor} 50%, ${arcanaColor}cc 100%)`,
            borderTop: `2px solid ${accentColor}`,
            borderBottom: `2px solid ${accentColor}`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 ${accentColor}33`,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <h1
            title={front.displayName || 'YOUR NAME'}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              fontFamily: "'Nanum Myeongjo', serif",
              lineHeight: '1.3',
              margin: 0,
              position: 'relative',
              textShadow: `0 1px 3px rgba(0,0,0,0.6), 0 0 8px ${accentColor}44`,
              letterSpacing: '1px',
            }}
          >
            {renderMultiLine(front.displayName || 'YOUR NAME')}
          </h1>
        </div>

        {/* Bottom description area */}
        <div
          style={{
            flex: '1 1 25%',
            minHeight: 0,
            margin: '0 8px',
            padding: '6px 8px',
            background: `linear-gradient(180deg, ${arcanaColor}22 0%, #08061A 100%)`,
            borderRadius: '0 0 4px 4px',
            border: `2px solid ${accentColor}55`,
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          {back.title && (
            <p
              title={back.title}
              style={{
                fontSize: '10px',
                color: `${accentColor}cc`,
                fontFamily: "'Nanum Myeongjo', serif",
                lineHeight: '1.4',
                margin: '0 0 4px 0',
                textAlign: 'center',
              }}
            >
              {back.title}
            </p>
          )}

          {/* Hashtags */}
          {back.hashtags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'center',
                overflow: 'hidden',
                maxHeight: '2.4em',
              }}
            >
              {back.hashtags.map((tag, i) => {
                const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: '9px',
                      color: `${accentColor}77`,
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

        {/* Bottom padding */}
        <div
          style={{
            flexShrink: 0,
            height: '8px',
          }}
        />
      </div>

      {/* Card number badge - top left (mystical circular badge) */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '36px',
          height: '36px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${arcanaColor}dd, ${arcanaColor} 60%, #000000 100%)`,
            border: `2px solid ${accentColor}`,
            boxShadow: `0 0 8px ${accentColor}44, inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`,
          }}
        />
        <span
          style={{
            position: 'relative',
            fontSize: '14px',
            fontWeight: 'bold',
            color: accentColor,
            fontFamily: "'Nanum Myeongjo', serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}
        >
          {cardNumber}
        </span>
      </div>

      {/* Arcana type badge - top right */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: '14px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          backgroundColor: 'rgba(0,0,0,0.65)',
          borderRadius: '10px',
          padding: '2px 8px 2px 4px',
          border: `1px solid ${accentColor}66`,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={arcanaConfig.iconData.viewBox}
          style={{
            width: '14px',
            height: '14px',
            fill: accentColor,
            flexShrink: 0,
          }}
        >
          <path d={arcanaConfig.iconData.path} />
        </svg>
        <span
          style={{
            fontSize: '8px',
            color: accentColor,
            fontFamily: "'Nanum Myeongjo', serif",
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          {arcanaConfig.label}
        </span>
      </div>

      {/* Mystique power badge - bottom right (eye/star shaped) */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: '38px',
          height: '38px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Star-shaped background */}
        <div
          style={{
            position: 'absolute',
            width: '34px',
            height: '34px',
            background: `radial-gradient(circle at 35% 35%, ${accentColor}ee, ${accentColor} 50%, ${arcanaColor} 100%)`,
            borderRadius: '50%',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 0 10px ${accentColor}55, inset 0 -2px 3px rgba(0,0,0,0.3)`,
          }}
        />
        {/* Eye icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            width: '12px',
            height: '12px',
            fill: '#FFFFFF',
            opacity: 0.7,
          }}
        >
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
        <span
          style={{
            position: 'relative',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: "'Nanum Myeongjo', serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}
        >
          {mystique}
        </span>
      </div>
    </div>
  );
}
