'use client';

import { useState } from 'react';
import type { CardData } from '@/types/card';
import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { getPokemonTypeConfig } from '@/components/card/pokemon-types';

interface ConfirmedCardPreviewProps {
  card: CardData;
  illustrationUrl: string;
}

function ConfirmedFront({
  displayName,
  illustrationUrl,
  backgroundColor,
  textColor,
}: {
  displayName: string;
  illustrationUrl: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <div
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden"
      style={{ backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Layer 2: Illustration image - full card cover */}
      <img
        src={illustrationUrl}
        alt="Confirmed illustration"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-wide"
          title={displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: (textColor || '#FFFFFF').toUpperCase() === '#FFFFFF'
              ? '1px rgba(0, 0, 0, 0.8)'
              : '1px rgba(255, 255, 255, 0.6)',
            color: textColor || '#FFFFFF',
            paintOrder: 'stroke fill',
            fontFamily: "'Nanum Myeongjo', serif",
          }}
        >
          {renderMultiLine(displayName || 'YOUR NAME')}
        </h1>
      </div>
    </div>
  );
}

/** Pokemon theme front for confirmed card preview */
function ConfirmedPokemonFront({
  card,
  illustrationUrl,
}: {
  card: CardData;
  illustrationUrl: string;
}) {
  const typeConfig = getPokemonTypeConfig(card.pokemonMeta?.type ?? 'electric');
  const exp = card.pokemonMeta?.exp ?? 100;
  const typeColor = typeConfig.color;

  return (
    <div
      className="relative w-full aspect-[29/45] overflow-hidden flex flex-col"
      style={{
        border: `4px solid ${typeColor}`,
        borderRadius: '12px',
        backgroundColor: '#FAFAF9',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          backgroundColor: `${typeColor}26`,
          borderBottom: `1px solid ${typeColor}40`,
        }}
      >
        <div className="flex-1 min-w-0 overflow-hidden">
          {card.back.title && (
            <p
              className="truncate leading-tight"
              style={{ fontSize: '10px', color: '#555555', fontFamily: "'Nanum Myeongjo', serif" }}
            >
              {card.back.title}
            </p>
          )}
          <h1
            className="font-bold truncate leading-tight"
            title={card.front.displayName || 'YOUR NAME'}
            style={{ fontSize: '18px', color: '#1A1A1A', fontFamily: "'Nanum Myeongjo', serif" }}
          >
            {renderMultiLine(card.front.displayName || 'YOUR NAME')}
          </h1>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span className="font-bold" style={{ fontSize: '12px', color: '#1A1A1A' }}>
            EXP {exp}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={typeConfig.iconData.viewBox}
            style={{ width: '16px', height: '16px', fill: typeColor, flexShrink: 0 }}
          >
            <path d={typeConfig.iconData.path} />
          </svg>
        </div>
      </div>

      {/* Center: Photo */}
      <div className="flex-1 flex items-center justify-center px-3 py-2" style={{ minHeight: 0 }}>
        <div
          className="w-full overflow-hidden"
          style={{
            border: `2px solid ${typeColor}`,
            borderRadius: '8px',
            height: '100%',
            position: 'relative',
          }}
        >
          <img
            src={illustrationUrl}
            alt="Confirmed illustration"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      {/* Bottom: Hashtags */}
      <div
        className="px-3 py-2"
        style={{
          backgroundColor: `${typeColor}15`,
          borderTop: `1px solid ${typeColor}30`,
        }}
      >
        <div className="flex flex-wrap gap-1 overflow-hidden" style={{ maxHeight: '3rem' }}>
          {card.back.hashtags.map((tag, i) => {
            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span
                key={i}
                style={{ fontSize: '11px', color: '#444444', fontFamily: "'Nanum Myeongjo', serif" }}
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

/** Pokemon theme back for confirmed card preview */
function ConfirmedPokemonBack({
  card,
}: {
  card: CardData;
}) {
  const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
  const sortedLinks = card.back.socialLinks
    .filter((link) => link.url || link.label)
    .sort((a, b) => {
      const aIdx = platformOrder.indexOf(a.platform);
      const bIdx = platformOrder.indexOf(b.platform);
      return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
    });

  return (
    <div
      className="relative w-full aspect-[29/45] overflow-hidden flex flex-col"
      style={{
        border: '4px solid #2A1A4A',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #1e3a5f, #4a1a6b)',
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Decorative pattern overlay */}
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

      {/* Main content */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-4 py-6"
        style={{ zIndex: 1 }}
      >
        <h2
          className="font-bold text-center mb-1"
          title={card.back.fullName || 'FULL NAME'}
          style={{ fontSize: '22px', color: '#FFFFFF', fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {renderMultiLine(card.back.fullName || 'FULL NAME')}
        </h2>
        <p
          className="text-center mb-4"
          title={card.back.title || 'Your Title'}
          style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)', fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {renderMultiLine(card.back.title || 'Your Title')}
        </p>
        {card.back.hashtags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 overflow-hidden" style={{ maxHeight: '3.5rem' }}>
            {card.back.hashtags.map((tag, i) => {
              const tagText = tag.startsWith('#') ? tag : `#${tag}`;
              return (
                <span
                  key={i}
                  style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: "'Nanum Myeongjo', serif" }}
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
        <div className="relative px-4 pb-3" style={{ zIndex: 1 }}>
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '8px' }}>
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
                {link.platform}/{extractHandle(link.url || link.label)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmedBack({
  fullName,
  title,
  hashtags,
  socialLinks,
  backgroundColor,
  textColor,
}: {
  fullName: string;
  title: string;
  hashtags: string[];
  socialLinks: { platform: string; url: string; label: string }[];
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <div
      className="relative w-full aspect-[29/45] rounded-lg shadow-xl overflow-hidden flex flex-col p-4 sm:p-6"
      style={{ backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Upper area (~80%): Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="text-[24px] font-bold mb-1"
          title={fullName || 'FULL NAME'}
          style={{ color: textColor || '#000000', fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {renderMultiLine(fullName || 'FULL NAME')}
        </h2>
        <p
          className="text-[20px] mb-4"
          title={title || 'Your Title'}
          style={{ color: textColor || '#000000', opacity: 0.9, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {renderMultiLine(title || 'Your Title')}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden max-h-[8rem]">
          {hashtags.map((tag, i) => {
            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span
                key={i}
                className="font-medium text-[20px]"
                style={{ color: textColor || '#000000' }}
              >
                {renderMultiLine(tagText)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom area (~20%): Social links */}
      {(() => {
        const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
        const sortedLinks = socialLinks
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
                style={{ color: textColor || '#000000', opacity: 0.8 }}
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

export function ConfirmedCardPreview({
  card,
  illustrationUrl,
}: ConfirmedCardPreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const isPokemon = card.theme === 'pokemon';

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        확정된 명함
      </h2>

      <div className="max-w-xs mx-auto">
        {side === 'front' ? (
          isPokemon ? (
            <ConfirmedPokemonFront card={card} illustrationUrl={illustrationUrl} />
          ) : (
            <ConfirmedFront
              displayName={card.front.displayName}
              illustrationUrl={illustrationUrl}
              backgroundColor={card.front.backgroundColor}
              textColor={card.front.textColor}
            />
          )
        ) : isPokemon ? (
          <ConfirmedPokemonBack card={card} />
        ) : (
          <ConfirmedBack
            fullName={card.back.fullName}
            title={card.back.title}
            hashtags={card.back.hashtags}
            socialLinks={card.back.socialLinks}
            backgroundColor={card.back.backgroundColor}
            textColor={card.back.textColor}
          />
        )}
      </div>

      <div className="flex justify-center mt-3">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setSide('front')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              side === 'front'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={side === 'front'}
          >
            앞면
          </button>
          <button
            type="button"
            onClick={() => setSide('back')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              side === 'back'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={side === 'back'}
          >
            뒷면
          </button>
        </div>
      </div>
    </div>
  );
}
