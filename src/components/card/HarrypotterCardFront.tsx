'use client';

import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getHarrypotterHouseConfig } from './harrypotter-types';

/**
 * HarrypotterCardFront - Harry Potter wizard card style front layout.
 * Ornate gold double border, dark parchment background with house-colored tint,
 * portrait with decorative frame, parchment name banner, house crest badge top-right,
 * year badge top-left, spell power bottom-right.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function HarrypotterCardFront() {
  const { front, back, harrypotterMeta } = useCardData();
  const houseConfig = getHarrypotterHouseConfig(harrypotterMeta?.house ?? 'gryffindor');
  const year = harrypotterMeta?.year ?? 1;
  const spellPower = harrypotterMeta?.spellPower ?? 100;
  const houseColor = houseConfig.color;
  const accentColor = houseConfig.accent;

  return (
    <div
      id="card-front"
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

      {/* Inner gold border (double border effect) */}
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
          background: `linear-gradient(180deg, ${houseColor}22 0%, #1A1008 30%, #0F0A04 100%)`,
        }}
      >
        {/* Portrait area (~55% height) */}
        <div
          style={{
            flex: '1 1 55%',
            position: 'relative',
            minHeight: 0,
            margin: '8px 8px 0 8px',
            borderRadius: '8px 8px 4px 4px',
            overflow: 'hidden',
            border: '3px solid #D4A76A',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5), 0 0 8px rgba(212,167,106,0.2)',
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
                background: `linear-gradient(135deg, ${houseColor}44, #1A1008)`,
              }}
            >
              <span
                style={{
                  color: '#8B7355',
                  fontSize: '12px',
                  fontFamily: "'Nanum Myeongjo', serif",
                }}
              >
                Upload Image
              </span>
            </div>
          )}

          {/* Vintage photo overlay - vignette effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
            }}
          />

          {/* Corner flourishes */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              width: '16px',
              height: '16px',
              borderTop: '2px solid #D4A76A',
              borderLeft: '2px solid #D4A76A',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              borderTop: '2px solid #D4A76A',
              borderRight: '2px solid #D4A76A',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              width: '16px',
              height: '16px',
              borderBottom: '2px solid #D4A76A',
              borderLeft: '2px solid #D4A76A',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              borderBottom: '2px solid #D4A76A',
              borderRight: '2px solid #D4A76A',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Name banner - parchment scroll style */}
        <div
          style={{
            flexShrink: 0,
            margin: '0 4px',
            padding: '6px 12px',
            background: `linear-gradient(180deg, #E8D5B0 0%, #D4C4A0 50%, #C8B890 100%)`,
            borderTop: `2px solid ${accentColor}`,
            borderBottom: `2px solid ${accentColor}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Parchment texture overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
              pointerEvents: 'none',
            }}
          />
          <h1
            title={front.displayName || 'YOUR NAME'}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: houseColor,
              fontFamily: "'Nanum Myeongjo', serif",
              lineHeight: '1.3',
              margin: 0,
              position: 'relative',
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {renderMultiLine(front.displayName || 'YOUR NAME')}
          </h1>
        </div>

        {/* Bottom description area - dark background */}
        <div
          style={{
            flex: '1 1 25%',
            minHeight: 0,
            margin: '0 8px',
            padding: '6px 8px',
            background: `linear-gradient(180deg, ${houseColor}18 0%, #0A0704 100%)`,
            borderRadius: '0 0 4px 4px',
            border: '2px solid #D4A76A',
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
                color: 'rgba(212,167,106,0.8)',
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

        {/* Bottom padding */}
        <div
          style={{
            flexShrink: 0,
            height: '8px',
          }}
        />
      </div>

      {/* Year badge - top left (wax seal style) */}
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
            background: `radial-gradient(circle at 35% 35%, ${houseColor}dd, ${houseColor} 60%, #000000 100%)`,
            border: '2px solid #D4A76A',
            boxShadow: `0 0 8px ${houseColor}66, inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)`,
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: '7px',
              fontWeight: 'bold',
              color: '#D4A76A',
              fontFamily: "'Nanum Myeongjo', serif",
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            Year
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#D4A76A',
              fontFamily: "'Nanum Myeongjo', serif",
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            {year}
          </span>
        </div>
      </div>

      {/* House crest badge - top right */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: '14px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '10px',
          padding: '2px 8px 2px 4px',
          border: '1px solid rgba(212,167,106,0.5)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={houseConfig.iconData.viewBox}
          style={{
            width: '14px',
            height: '14px',
            fill: accentColor,
            flexShrink: 0,
          }}
        >
          <path d={houseConfig.iconData.path} />
        </svg>
        <span
          style={{
            fontSize: '9px',
            color: accentColor,
            fontFamily: "'Nanum Myeongjo', serif",
            fontWeight: 'bold',
          }}
        >
          {houseConfig.name}
        </span>
      </div>

      {/* Spell Power badge - bottom right (star/wand shape) */}
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
            background: `radial-gradient(circle at 35% 35%, #FFE066, ${accentColor} 50%, ${houseColor} 100%)`,
            borderRadius: '50%',
            border: '2px solid #D4A76A',
            boxShadow: `0 0 8px ${accentColor}66, inset 0 -2px 3px rgba(0,0,0,0.3)`,
          }}
        />
        {/* Wand icon */}
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
          <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zM4.5 8.8l-1 1.7-2 .3 1.5 1.4-.4 2 1.8-1 1.9 1-.4-2L7.3 11l-2-.3-.8-1.9z" />
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
          {spellPower}
        </span>
      </div>
    </div>
  );
}
