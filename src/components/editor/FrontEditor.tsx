'use client';

import { useCardStore } from '@/stores/useCardStore';
import { ImageUploader } from './ImageUploader';
import { ColorPicker } from './ColorPicker';
import { TextColorPicker } from './TextColorPicker';
import { PokemonTypeSelector } from './PokemonTypeSelector';
import { ExpInput } from './ExpInput';

export function FrontEditor() {
  const front = useCardStore((state) => state.card.front);
  const theme = useCardStore((state) => state.card.theme ?? 'classic');
  const updateFront = useCardStore((state) => state.updateFront);

  const isPokemon = theme === 'pokemon';

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={front.displayName}
          onChange={(e) => updateFront({ displayName: e.target.value })}
          placeholder="WONDER.CHOI"
          maxLength={40}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
        />
      </div>
      <ImageUploader />

      {/* Pokemon-specific editors */}
      {isPokemon && (
        <>
          <PokemonTypeSelector />
          <ExpInput />
        </>
      )}

      {/* Classic theme: show background color picker. Pokemon theme uses type colors instead. */}
      {!isPokemon && (
        <ColorPicker
          color={front.backgroundColor}
          onChange={(color) => updateFront({ backgroundColor: color })}
          label="Background Color"
        />
      )}

      {/* Text color picker: only relevant for classic theme */}
      {!isPokemon && (
        <TextColorPicker
          color={front.textColor || '#FFFFFF'}
          onChange={(color) => updateFront({ textColor: color })}
        />
      )}
    </div>
  );
}
