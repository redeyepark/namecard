'use client';

import { useCardStore } from '@/stores/useCardStore';
import { Input } from '@/components/ui';
import { ImageUploader } from './ImageUploader';
import { ColorPicker } from './ColorPicker';
import { TextColorPicker } from './TextColorPicker';
import { PokemonTypeSelector } from './PokemonTypeSelector';
import { ExpInput } from './ExpInput';
import { HearthstoneClassSelector } from './HearthstoneClassSelector';
import { HearthstoneStatInput } from './HearthstoneStatInput';
import { HarrypotterHouseSelector } from './HarrypotterHouseSelector';
import { HarrypotterStatInput } from './HarrypotterStatInput';
import { TarotArcanaSelector } from './TarotArcanaSelector';
import { TarotStatInput } from './TarotStatInput';

export function FrontEditor() {
  const front = useCardStore((state) => state.card.front);
  const theme = useCardStore((state) => state.card.theme ?? 'classic');
  const updateFront = useCardStore((state) => state.updateFront);

  const isPokemon = theme === 'pokemon';
  const isHearthstone = theme === 'hearthstone';
  const isHarrypotter = theme === 'harrypotter';
  const isTarot = theme === 'tarot';
  const isNametag = theme === 'nametag';
  const isClassic = !isPokemon && !isHearthstone && !isHarrypotter && !isTarot && !isNametag;

  return (
    <div className="space-y-4">
      <Input
        id="displayName"
        label="Display Name"
        value={front.displayName}
        onChange={(e) => updateFront({ displayName: e.target.value })}
        placeholder="WONDER.CHOI"
        maxLength={40}
        className="min-h-[44px]"
      />
      <ImageUploader />

      {/* Pokemon-specific editors */}
      {isPokemon && (
        <>
          <PokemonTypeSelector />
          <ExpInput />
        </>
      )}

      {/* Hearthstone-specific editors */}
      {isHearthstone && (
        <>
          <HearthstoneClassSelector />
          <HearthstoneStatInput />
        </>
      )}

      {/* Harry Potter-specific editors */}
      {isHarrypotter && (
        <>
          <HarrypotterHouseSelector />
          <HarrypotterStatInput />
        </>
      )}

      {/* Tarot-specific editors */}
      {isTarot && (
        <>
          <TarotArcanaSelector />
          <TarotStatInput />
        </>
      )}

      {/* Nametag theme: show only background color picker (no text on front) */}
      {isNametag && (
        <ColorPicker
          color={front.backgroundColor}
          onChange={(color) => updateFront({ backgroundColor: color })}
          label="Background Color"
        />
      )}

      {/* Classic theme: show background color picker. Themed cards use their own colors. */}
      {isClassic && (
        <ColorPicker
          color={front.backgroundColor}
          onChange={(color) => updateFront({ backgroundColor: color })}
          label="Background Color"
        />
      )}

      {/* Text color picker: only relevant for classic theme */}
      {isClassic && (
        <TextColorPicker
          color={front.textColor || '#FFFFFF'}
          onChange={(color) => updateFront({ textColor: color })}
        />
      )}
    </div>
  );
}
