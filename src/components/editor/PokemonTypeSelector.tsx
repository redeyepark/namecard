'use client';

import { useCardStore } from '@/stores/useCardStore';
import { POKEMON_TYPES } from '@/components/card/pokemon-types';
import type { PokemonType } from '@/types/card';

export function PokemonTypeSelector() {
  const pokemonType = useCardStore(
    (state) => state.card.pokemonMeta?.type ?? 'electric'
  );
  const setPokemonType = useCardStore((state) => state.setPokemonType);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Type
      </label>
      <div
        role="radiogroup"
        aria-label="Pokemon type selection"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {POKEMON_TYPES.map((typeConfig) => {
          const isSelected = pokemonType === typeConfig.id;
          return (
            <button
              key={typeConfig.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${typeConfig.name} - ${typeConfig.label}`}
              onClick={() => setPokemonType(typeConfig.id as PokemonType)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all min-h-[44px] ${
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Colored dot */}
              <div
                className={`w-4 h-4 rounded-full flex-shrink-0 ${
                  isSelected ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: typeConfig.color,
                  // Use box-shadow for ring when selected to ensure compatibility
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 0 0 4px ${typeConfig.color}`
                    : undefined,
                }}
              />
              {/* Labels */}
              <div className="flex flex-col items-start min-w-0">
                <span
                  className={`text-sm font-medium leading-tight ${
                    isSelected ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {typeConfig.name}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    isSelected ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {typeConfig.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
