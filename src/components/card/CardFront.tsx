'use client';

import { isBuiltinTheme } from '@/types/card';
import { renderMultiLine } from '@/lib/text-utils';
import { useCardData } from './CardDataProvider';
import { PokemonCardFront } from './PokemonCardFront';
import { HearthstoneCardFront } from './HearthstoneCardFront';
import { HarrypotterCardFront } from './HarrypotterCardFront';
import { TarotCardFront } from './TarotCardFront';
import { NametagCardFront } from './NametagCardFront';
import { SNSProfileCardFront } from './SNSProfileCardFront';
import { CustomThemeCardFront } from './CustomThemeCardFront';

/**
 * CardFront wrapper that delegates to the appropriate theme renderer.
 * Classic theme preserves 100% original behavior.
 * Non-builtin themes are routed to CustomThemeCardFront.
 */
export function CardFront() {
  const card = useCardData();
  const theme = card.theme ?? 'classic';

  if (theme === 'pokemon') return <PokemonCardFront />;
  if (theme === 'hearthstone') return <HearthstoneCardFront />;
  if (theme === 'harrypotter') return <HarrypotterCardFront />;
  if (theme === 'tarot') return <TarotCardFront />;
  if (theme === 'nametag') return <NametagCardFront />;
  if (theme === 'snsprofile') return <SNSProfileCardFront />;
  if (!isBuiltinTheme(theme)) return <CustomThemeCardFront themeSlug={theme} />;
  return <ClassicCardFront />;
}

/**
 * ClassicCardFront - Identical to the original CardFront rendering.
 * No changes to layout, styles, or behavior.
 */
export function ClassicCardFront() {
  const { front } = useCardData();

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[29/45] overflow-hidden"
      style={{ backgroundColor: front.backgroundColor, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {/* Layer 2: Illustration image - full card cover */}
      {front.avatarImage ? (
        <img
          src={front.avatarImage}
          alt="Illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black/5 flex items-center justify-center">
          <span className="text-black/30 text-xs sm:text-sm">Upload Image</span>
        </div>
      )}

      {/* Layer 3: Display name overlay at top-left */}
      <div className="relative z-10 p-4 sm:p-6 pt-4 sm:pt-5">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-wide"
          title={front.displayName || 'YOUR NAME'}
          style={{
            WebkitTextStroke: (front.textColor || '#FFFFFF').toUpperCase() === '#FFFFFF'
              ? '1px rgba(0, 0, 0, 0.8)'
              : '1px rgba(255, 255, 255, 0.6)',
            color: front.textColor || '#FFFFFF',
            paintOrder: 'stroke fill',
            fontFamily: "'Nanum Myeongjo', serif",
          }}
        >
          {renderMultiLine(front.displayName || 'YOUR NAME')}
        </h1>
      </div>
    </div>
  );
}
