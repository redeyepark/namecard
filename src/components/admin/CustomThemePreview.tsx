'use client';

import { useState } from 'react';
import type { CustomTheme } from '@/types/custom-theme';

interface CustomThemePreviewProps {
  theme: Partial<CustomTheme>;
}

/**
 * Mini card preview showing how a custom theme would look.
 * Renders front and back views with a toggle.
 * All styles are inline to reflect the theme's custom colors.
 */
export function CustomThemePreview({ theme }: CustomThemePreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  const baseTemplate = theme.baseTemplate ?? 'classic';
  const fontFamily = theme.fontFamily || 'Nanum Myeongjo';

  const frontBg = theme.frontBgColor || '#020912';
  const frontText = theme.frontTextColor || '#fcfcfc';
  const frontBorder = theme.frontBorderColor || '#020912';
  const backBg = theme.backBgColor || '#fcfcfc';
  const backText = theme.backTextColor || '#020912';
  const backBorder = theme.backBorderColor || '#020912';
  const accent = theme.accentColor || '#020912';
  const borderStyle = theme.borderStyle || 'none';
  const borderWidth = theme.borderWidth ?? 0;

  const isNametagBase = baseTemplate === 'nametag';

  const currentBg = side === 'front' ? frontBg : backBg;
  const currentText = side === 'front' ? frontText : backText;
  const currentBorder = side === 'front' ? frontBorder : backBorder;

  return (
    <div className="space-y-3">
      {/* Side toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('front')}
          className={`min-h-[36px] px-3 text-xs font-medium transition-colors ${
            side === 'front'
              ? 'bg-[#020912] text-white'
              : 'bg-gray-100 text-[#020912]/60 hover:bg-gray-200'
          }`}
          aria-pressed={side === 'front'}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setSide('back')}
          className={`min-h-[36px] px-3 text-xs font-medium transition-colors ${
            side === 'back'
              ? 'bg-[#020912] text-white'
              : 'bg-gray-100 text-[#020912]/60 hover:bg-gray-200'
          }`}
          aria-pressed={side === 'back'}
        >
          Back
        </button>
      </div>

      {/* Card preview */}
      <div
        className="relative w-full aspect-[29/45] overflow-hidden"
        style={{
          backgroundColor: currentBg,
          border: borderStyle !== 'none' ? `${borderWidth}px ${borderStyle} ${currentBorder}` : 'none',
          fontFamily: `'${fontFamily}', serif`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        role="img"
        aria-label={`${theme.name || 'Custom theme'} preview - ${side} side`}
      >
        {isNametagBase ? (
          // Nametag-style layout
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {/* Accent bar at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[30%]"
              style={{ backgroundColor: accent }}
            />
            {/* Name area */}
            <div className="relative z-10 mt-auto mb-2">
              {side === 'front' ? (
                <>
                  <p
                    className="text-[10px] uppercase tracking-widest mb-1"
                    style={{ color: currentText, opacity: 0.6 }}
                  >
                    HELLO MY NAME IS
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: currentText }}
                  >
                    Hong Gildong
                  </p>
                </>
              ) : (
                <>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: currentText }}
                  >
                    Hong Gildong
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: currentText, opacity: 0.7 }}
                  >
                    Software Developer
                  </p>
                  <p
                    className="text-[9px] mt-2"
                    style={{ color: currentText, opacity: 0.5 }}
                  >
                    hong@example.com
                  </p>
                </>
              )}
            </div>
            <div className="mt-auto" />
          </div>
        ) : (
          // Classic-style layout
          <div className="flex flex-col h-full p-4">
            {side === 'front' ? (
              <>
                {/* Accent line */}
                <div
                  className="w-8 h-0.5 mb-3"
                  style={{ backgroundColor: accent }}
                />
                {/* Avatar placeholder */}
                <div
                  className="w-12 h-12 rounded-full mb-3 flex items-center justify-center"
                  style={{ backgroundColor: accent, opacity: 0.3 }}
                >
                  <span style={{ color: currentText, fontSize: '10px' }}>IMG</span>
                </div>
                <p
                  className="text-base font-bold"
                  style={{ color: currentText }}
                >
                  Hong Gildong
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: currentText, opacity: 0.6 }}
                >
                  Sample Card
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: currentText }}
                >
                  Hong Gildong
                </p>
                <p
                  className="text-[10px] mb-1"
                  style={{ color: currentText, opacity: 0.7 }}
                >
                  Software Developer
                </p>
                <div
                  className="w-6 h-0.5 my-2"
                  style={{ backgroundColor: accent }}
                />
                <p
                  className="text-[9px]"
                  style={{ color: currentText, opacity: 0.5 }}
                >
                  #Development #Innovation
                </p>
                <div className="mt-auto">
                  <p
                    className="text-[8px]"
                    style={{ color: currentText, opacity: 0.4 }}
                  >
                    hong@example.com
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Theme name badge */}
        {theme.name && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-semibold"
            style={{
              backgroundColor: accent,
              color: frontBg,
            }}
          >
            {theme.name}
          </div>
        )}
      </div>
    </div>
  );
}
