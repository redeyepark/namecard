'use client';

import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getHearthstoneClassConfig } from './hearthstone-types';

/**
 * HearthstoneCardFront - Hearthstone minion card style front layout.
 * Stone/brown textured frame, mana crystal top-left, portrait center,
 * name banner middle, attack bottom-left, health bottom-right.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function HearthstoneCardFront() {
  const { front, back, hearthstoneMeta } = useCardData();
  const classConfig = getHearthstoneClassConfig(hearthstoneMeta?.classType ?? 'warrior');
  const mana = hearthstoneMeta?.mana ?? 3;
  const attack = hearthstoneMeta?.attack ?? 2;
  const health = hearthstoneMeta?.health ?? 5;
  const classColor = classConfig.color;

  return (
    <div
      id="card-front"
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
          background: 'linear-gradient(180deg, #5C4830 0%, #3D2B1F 30%, #2A1F14 100%)',
        }}
      >
        {/* Portrait area (~55% height) */}
        <div
          style={{
            flex: '1 1 55%',
            position: 'relative',
            minHeight: 0,
            margin: '8px 8px 0 8px',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '3px solid #6B5B3E',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
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
                background: 'linear-gradient(135deg, #4A3728, #2A1F14)',
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

          {/* Stone frame corner decorations */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Name banner - parchment style */}
        <div
          style={{
            flexShrink: 0,
            margin: '0 4px',
            padding: '6px 12px',
            background: 'linear-gradient(180deg, #D4A76A 0%, #C4965A 50%, #B8894E 100%)',
            borderTop: '2px solid #8B6914',
            borderBottom: '2px solid #8B6914',
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
              opacity: 0.08,
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
              color: '#2A1F14',
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
            background: 'linear-gradient(180deg, #1A1210 0%, #0F0C0A 100%)',
            borderRadius: '0 0 4px 4px',
            border: '2px solid #6B5B3E',
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
                color: 'rgba(255,255,255,0.7)',
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
                      color: 'rgba(255,255,255,0.5)',
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

        {/* Bottom stat area with padding */}
        <div
          style={{
            flexShrink: 0,
            height: '8px',
          }}
        />
      </div>

      {/* Mana crystal - top left */}
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
        {/* Crystal gem shape via CSS */}
        <div
          style={{
            position: 'absolute',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #5BC0FF, #1E90FF 40%, #0050AA 80%, #003366 100%)',
            border: '2px solid #8B6914',
            boxShadow: '0 0 8px rgba(30,144,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
          }}
        />
        <span
          style={{
            position: 'relative',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: "'Nanum Myeongjo', serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)',
            lineHeight: 1,
          }}
        >
          {mana}
        </span>
      </div>

      {/* Class icon badge - top right */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: '14px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '10px',
          padding: '2px 8px 2px 4px',
          border: '1px solid rgba(139,105,20,0.5)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={classConfig.iconData.viewBox}
          style={{
            width: '14px',
            height: '14px',
            fill: classColor,
            flexShrink: 0,
          }}
        >
          <path d={classConfig.iconData.path} />
        </svg>
        <span
          style={{
            fontSize: '9px',
            color: classColor,
            fontFamily: "'Nanum Myeongjo', serif",
            fontWeight: 'bold',
          }}
        >
          {classConfig.label}
        </span>
      </div>

      {/* Attack stat - bottom left (sword) */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          width: '38px',
          height: '38px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Attack gem - yellow/gold */}
        <div
          style={{
            position: 'absolute',
            width: '34px',
            height: '34px',
            background: 'radial-gradient(circle at 35% 35%, #FFE066, #DAA520 40%, #B8860B 80%, #8B6914 100%)',
            borderRadius: '50%',
            border: '2px solid #6B5B3E',
            boxShadow: '0 0 6px rgba(218,165,32,0.4), inset 0 -2px 3px rgba(0,0,0,0.3)',
          }}
        />
        {/* Sword icon */}
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
          <path d="M6.92 5L5 6.92l5.79 5.79L5.5 18H2v2h5.5l5.29-5.29L18.08 20 20 18.08 6.92 5zM20.5 2H18l-3 3 2.5 2.5L20.5 2z" />
        </svg>
        <span
          style={{
            position: 'relative',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: "'Nanum Myeongjo', serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}
        >
          {attack}
        </span>
      </div>

      {/* Health stat - bottom right (blood drop) */}
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
        {/* Health gem - red */}
        <div
          style={{
            position: 'absolute',
            width: '34px',
            height: '34px',
            background: 'radial-gradient(circle at 35% 35%, #FF6666, #CC0000 40%, #8B0000 80%, #5C0000 100%)',
            borderRadius: '50%',
            border: '2px solid #6B5B3E',
            boxShadow: '0 0 6px rgba(204,0,0,0.4), inset 0 -2px 3px rgba(0,0,0,0.3)',
          }}
        />
        {/* Blood drop icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            fill: '#FFFFFF',
            opacity: 0.7,
          }}
        >
          <path d="M12 2C8 8.5 5 11 5 15c0 3.9 3.1 7 7 7s7-3.1 7-7c0-4-3-6.5-7-13z" />
        </svg>
        <span
          style={{
            position: 'relative',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: "'Nanum Myeongjo', serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}
        >
          {health}
        </span>
      </div>
    </div>
  );
}
