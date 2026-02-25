'use client';

import { useCardStore } from '@/stores/useCardStore';
import { renderMultiLine } from '@/lib/text-utils';
import { getPokemonTypeConfig } from './pokemon-types';

/**
 * PokemonCardFront - Trading card style front layout.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function PokemonCardFront() {
  const { front, back, pokemonMeta } = useCardStore((state) => state.card);
  const typeConfig = getPokemonTypeConfig(pokemonMeta?.type ?? 'electric');
  const exp = pokemonMeta?.exp ?? 100;
  const typeColor = typeConfig.color;

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[29/45] overflow-hidden flex flex-col"
      style={{
        border: `4px solid ${typeColor}`,
        borderRadius: '12px',
        backgroundColor: '#FAFAF9',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Top bar: title, name, EXP, type icon */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          backgroundColor: `${typeColor}26`,
          borderBottom: `1px solid ${typeColor}40`,
        }}
      >
        {/* Left: title + display name */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {back.title && (
            <p
              className="truncate leading-tight"
              style={{
                fontSize: '10px',
                color: '#555555',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              {back.title}
            </p>
          )}
          <h1
            className="font-bold truncate leading-tight"
            title={front.displayName || 'YOUR NAME'}
            style={{
              fontSize: '18px',
              color: '#1A1A1A',
              fontFamily: "'Nanum Myeongjo', serif",
            }}
          >
            {renderMultiLine(front.displayName || 'YOUR NAME')}
          </h1>
        </div>

        {/* Right: EXP + type icon */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span
            className="font-bold"
            style={{ fontSize: '12px', color: '#1A1A1A' }}
          >
            EXP {exp}
          </span>
          {/* Inline SVG type icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={typeConfig.iconData.viewBox}
            style={{
              width: '16px',
              height: '16px',
              fill: typeColor,
              flexShrink: 0,
            }}
          >
            <path d={typeConfig.iconData.path} />
          </svg>
        </div>
      </div>

      {/* Center: Photo / illustration window */}
      <div
        className="flex-1 flex items-center justify-center px-3 py-2"
        style={{ minHeight: 0 }}
      >
        <div
          className="w-full overflow-hidden"
          style={{
            border: `2px solid ${typeColor}`,
            borderRadius: '8px',
            height: '100%',
            position: 'relative',
          }}
        >
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
                backgroundColor: `${typeColor}0D`,
              }}
            >
              <span style={{ color: '#999999', fontSize: '12px' }}>
                Upload Image
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Hashtags */}
      <div
        className="px-3 py-2"
        style={{
          backgroundColor: `${typeColor}15`,
          borderTop: `1px solid ${typeColor}30`,
        }}
      >
        <div
          className="flex flex-wrap gap-1 overflow-hidden"
          style={{ maxHeight: '3rem' }}
        >
          {back.hashtags.map((tag, i) => {
            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  color: '#444444',
                  fontFamily: "'Nanum Myeongjo', serif",
                }}
              >
                {renderMultiLine(tagText)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
