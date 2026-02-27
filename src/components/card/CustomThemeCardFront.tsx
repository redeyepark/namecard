'use client';

import { useCardStore } from '@/stores/useCardStore';
import { useCustomThemes } from '@/hooks/useCustomThemes';
import { renderMultiLine } from '@/lib/text-utils';
import { ClassicCardFront } from './CardFront';
import type { CustomTheme } from '@/types/custom-theme';

interface CustomThemeCardFrontProps {
  themeSlug: string;
}

/**
 * CustomThemeCardFront - Renders the front of a custom-themed card.
 * Delegates to a classic or nametag base layout with custom colors, font, and border.
 * Falls back to ClassicCardFront if the theme definition is not found.
 * All visual styles are inline for html-to-image compatibility.
 */
export function CustomThemeCardFront({ themeSlug }: CustomThemeCardFrontProps) {
  const { themes } = useCustomThemes();
  const themeDef = themes?.find((t) => t.slug === themeSlug) ?? null;

  if (!themeDef) {
    return <ClassicCardFront />;
  }

  if (themeDef.baseTemplate === 'nametag') {
    return <CustomNametagFront themeDef={themeDef} />;
  }

  return <CustomClassicFront themeDef={themeDef} />;
}

/**
 * CustomClassicFront - Classic layout (aspect-[29/45]) with custom theme colors/font/border.
 * Same structure as ClassicCardFront: avatar image area, display name overlay, title, hashtags.
 */
function CustomClassicFront({ themeDef }: { themeDef: CustomTheme }) {
  const { front } = useCardStore((state) => state.card);

  const fontFamily = themeDef.fontFamily || "'Nanum Myeongjo', serif";
  const textColor = themeDef.frontTextColor || front.textColor || '#FFFFFF';
  const bgColor = themeDef.frontBgColor || front.backgroundColor;
  const borderColor = themeDef.frontBorderColor || 'transparent';
  const borderStyle = themeDef.borderStyle || 'none';
  const borderWidth = themeDef.borderWidth || 0;

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[29/45] overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        borderColor,
        borderStyle,
        borderWidth: borderStyle !== 'none' ? `${borderWidth}px` : undefined,
        boxSizing: 'border-box',
      }}
    >
      {/* Layer 2: Illustration image - full card cover */}
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
            background: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              fontFamily,
            }}
          >
            Upload Image
          </span>
        </div>
      )}

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-wide"
          title={front.displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: textColor.toUpperCase() === '#FFFFFF'
              ? '1px rgba(0, 0, 0, 0.8)'
              : '1px rgba(255, 255, 255, 0.6)',
            color: textColor,
            paintOrder: 'stroke fill',
            fontFamily,
          }}
        >
          {renderMultiLine(front.displayName || 'YOUR NAME')}
        </h1>
      </div>
    </div>
  );
}

/**
 * CustomNametagFront - Nametag layout (aspect-[197/354]) with custom theme background.
 * Full-bleed illustration, no text overlay. Same structure as NametagCardFront.
 */
function CustomNametagFront({ themeDef }: { themeDef: CustomTheme }) {
  const { front } = useCardStore((state) => state.card);

  const fontFamily = themeDef.fontFamily || "'Nanum Myeongjo', serif";
  const bgColor = themeDef.frontBgColor || front.backgroundColor;
  const borderColor = themeDef.frontBorderColor || 'transparent';
  const borderStyle = themeDef.borderStyle || 'none';
  const borderWidth = themeDef.borderWidth || 0;

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[197/354] overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        borderColor,
        borderStyle,
        borderWidth: borderStyle !== 'none' ? `${borderWidth}px` : undefined,
        boxSizing: 'border-box',
      }}
    >
      {/* Full-bleed illustration - no text overlay */}
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
            background: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              fontFamily,
            }}
          >
            Upload Image
          </span>
        </div>
      )}
    </div>
  );
}
