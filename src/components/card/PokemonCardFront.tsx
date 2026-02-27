'use client';

import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { getPokemonTypeConfig } from './pokemon-types';

/**
 * PokemonCardFront - Trading card style front layout matching reference SVG design.
 * Gray base with thick gold border, full-bleed illustration, semi-transparent overlay,
 * and orange HP badge.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function PokemonCardFront() {
  const { front, back, pokemonMeta } = useCardData();
  const typeConfig = getPokemonTypeConfig(pokemonMeta?.type ?? 'electric');
  const exp = pokemonMeta?.exp ?? 100;
  const typeColor = typeConfig.color;

  return (
    <div
      id="card-front"
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

        {/* Full-bleed illustration area (~63% of card height) */}
        <div
          style={{
            flex: '1 1 63%',
            position: 'relative',
            minHeight: 0,
            backgroundColor: '#808080',
          }}
        >
          {/* Name overlay - top left */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '4px',
              padding: '4px 10px',
              maxWidth: '70%',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                fontFamily: "'Nanum Myeongjo', serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
              }}
            >
              {front.displayName || 'YOUR NAME'}
            </span>
          </div>
          {front.avatarImage ? (
            <img
              src={front.avatarImage}
              alt="Illustration"
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
                backgroundColor: '#707070',
              }}
            >
              <span
                style={{
                  color: '#AAAAAA',
                  fontSize: '12px',
                  fontFamily: "'Nanum Myeongjo', serif",
                }}
              >
                Upload Image
              </span>
            </div>
          )}
        </div>

        {/* Semi-transparent bottom info section (~17% height) */}
        <div
          style={{
            flexShrink: 0,
            backgroundColor: 'rgba(234, 233, 234, 0.8)',
            padding: '6px 10px',
            minHeight: '17%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Name (bold) */}
          <h1
            className="font-bold"
            title={front.displayName || 'YOUR NAME'}
            style={{
              fontSize: '16px',
              color: '#262626',
              fontFamily: "'Nanum Myeongjo', serif",
              lineHeight: '1.3',
              margin: 0,
            }}
          >
            {renderMultiLine(front.displayName || 'YOUR NAME')}
          </h1>

          {/* Title */}
          {back.title && (
            <p
              style={{
                fontSize: '10px',
                color: '#555555',
                fontFamily: "'Nanum Myeongjo', serif",
                lineHeight: '1.3',
                margin: '2px 0 0 0',
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
                marginTop: '4px',
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
                      color: '#444444',
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

        {/* Orange rounded HP badge */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '4px 8px 6px 8px',
            backgroundColor: '#808080',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#EBB373',
              border: '2px solid #E1DFDE',
              borderRadius: '20px',
              padding: '3px 10px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              HP
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              {exp}
            </span>
            {/* Type icon inside HP badge */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={typeConfig.iconData.viewBox}
              style={{
                width: '14px',
                height: '14px',
                fill: typeColor,
                flexShrink: 0,
              }}
            >
              <path d={typeConfig.iconData.path} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
