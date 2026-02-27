'use client';

import type { CardTheme, PokemonType, HearthstoneClass, HarrypotterHouse, TarotArcana } from '@/types/card';
import { POKEMON_TYPES } from '@/components/card/pokemon-types';
import { HEARTHSTONE_CLASSES } from '@/components/card/hearthstone-types';
import { HARRYPOTTER_HOUSES } from '@/components/card/harrypotter-types';
import { TAROT_ARCANAS } from '@/components/card/tarot-types';
import { THEME_LIST } from '@/components/admin/ThemeListBox';

export interface ThemeEditState {
  pokemon: { type: PokemonType; exp: number };
  hearthstone: { classType: HearthstoneClass; mana: number; attack: number; health: number };
  harrypotter: { house: HarrypotterHouse; year: number; spellPower: number };
  tarot: { arcana: TarotArcana; cardNumber: number; mystique: number };
}

export const DEFAULT_EDIT_STATE: ThemeEditState = {
  pokemon: { type: 'electric', exp: 100 },
  hearthstone: { classType: 'mage', mana: 3, attack: 4, health: 5 },
  harrypotter: { house: 'gryffindor', year: 1, spellPower: 100 },
  tarot: { arcana: 'major', cardNumber: 0, mystique: 100 },
};

interface ThemeEditPanelProps {
  selectedTheme: CardTheme;
  editState: ThemeEditState;
  onChange: (theme: CardTheme, editState: ThemeEditState) => void;
}

export function ThemeEditPanel({ selectedTheme, editState, onChange }: ThemeEditPanelProps) {
  const themeInfo = THEME_LIST.find((t) => t.id === selectedTheme);

  if (selectedTheme === 'classic') {
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[#020912] mb-2">
          {themeInfo?.name} Options
        </h3>
        <p className="text-sm text-[#020912]/50">
          {'\uc774 \ud14c\ub9c8\ub294 \ubcc0\ud615 \uc635\uc158\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.'}
        </p>
        {themeInfo && (
          <p className="text-xs text-[#020912]/40 mt-2">{themeInfo.description}</p>
        )}
      </div>
    );
  }

  if (selectedTheme === 'pokemon') {
    const pokemonState = editState.pokemon;
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#020912]">
          {themeInfo?.name} Options
        </h3>

        {/* Type chip grid */}
        <div>
          <p className="text-xs text-[#020912]/50 mb-2">{'\ud0c0\uc785 \uc120\ud0dd'}</p>
          <div className="flex flex-wrap gap-2">
            {POKEMON_TYPES.map((typeConfig) => (
              <button
                key={typeConfig.id}
                type="button"
                onClick={() => {
                  const newState = {
                    ...editState,
                    pokemon: { ...pokemonState, type: typeConfig.id },
                  };
                  onChange(selectedTheme, newState);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                  pokemonState.type === typeConfig.id
                    ? 'ring-2 ring-offset-1 ring-gray-900 bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={pokemonState.type === typeConfig.id}
                aria-label={`${typeConfig.name} (${typeConfig.label}) type`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={typeConfig.iconData.viewBox}
                  className="w-3.5 h-3.5"
                  style={{ fill: pokemonState.type === typeConfig.id ? '#FFFFFF' : typeConfig.color }}
                  aria-hidden="true"
                >
                  <path d={typeConfig.iconData.path} />
                </svg>
                {typeConfig.name}
              </button>
            ))}
          </div>
        </div>

        {/* EXP input */}
        <div>
          <label htmlFor="edit-pokemon-exp" className="block text-xs text-[#020912]/50 mb-1">
            EXP (0-999)
          </label>
          <input
            id="edit-pokemon-exp"
            type="number"
            min={0}
            max={999}
            value={pokemonState.exp}
            onChange={(e) => {
              const newState = {
                ...editState,
                pokemon: { ...pokemonState, exp: Math.min(999, Math.max(0, Number(e.target.value))) },
              };
              onChange(selectedTheme, newState);
            }}
            className="w-full sm:w-32 border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
          />
        </div>
      </div>
    );
  }

  if (selectedTheme === 'hearthstone') {
    const hsState = editState.hearthstone;
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#020912]">
          {themeInfo?.name} Options
        </h3>

        {/* Class chip grid */}
        <div>
          <p className="text-xs text-[#020912]/50 mb-2">{'\uc9c1\uc5c5 \uc120\ud0dd'}</p>
          <div className="flex flex-wrap gap-2">
            {HEARTHSTONE_CLASSES.map((classConfig) => (
              <button
                key={classConfig.id}
                type="button"
                onClick={() => {
                  const newState = {
                    ...editState,
                    hearthstone: { ...hsState, classType: classConfig.id },
                  };
                  onChange(selectedTheme, newState);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                  hsState.classType === classConfig.id
                    ? 'ring-2 ring-offset-1 ring-gray-900 bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={hsState.classType === classConfig.id}
                aria-label={`${classConfig.name} (${classConfig.label}) class`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={classConfig.iconData.viewBox}
                  className="w-3.5 h-3.5"
                  style={{ fill: hsState.classType === classConfig.id ? '#FFFFFF' : classConfig.color }}
                  aria-hidden="true"
                >
                  <path d={classConfig.iconData.path} />
                </svg>
                {classConfig.name}
              </button>
            ))}
          </div>
        </div>

        {/* Number inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="edit-hs-mana" className="block text-xs text-[#020912]/50 mb-1">
              {'\ub9c8\ub098'} (0-10)
            </label>
            <input
              id="edit-hs-mana"
              type="number"
              min={0}
              max={10}
              value={hsState.mana}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  hearthstone: { ...hsState, mana: Math.min(10, Math.max(0, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
          <div>
            <label htmlFor="edit-hs-attack" className="block text-xs text-[#020912]/50 mb-1">
              {'\uacf5\uaca9\ub825'} (0-12)
            </label>
            <input
              id="edit-hs-attack"
              type="number"
              min={0}
              max={12}
              value={hsState.attack}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  hearthstone: { ...hsState, attack: Math.min(12, Math.max(0, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
          <div>
            <label htmlFor="edit-hs-health" className="block text-xs text-[#020912]/50 mb-1">
              {'\uccb4\ub825'} (1-12)
            </label>
            <input
              id="edit-hs-health"
              type="number"
              min={1}
              max={12}
              value={hsState.health}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  hearthstone: { ...hsState, health: Math.min(12, Math.max(1, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'harrypotter') {
    const hpState = editState.harrypotter;
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#020912]">
          {themeInfo?.name} Options
        </h3>

        {/* House selection */}
        <div>
          <p className="text-xs text-[#020912]/50 mb-2">{'\uae30\uc219\uc0ac \uc120\ud0dd'}</p>
          <div className="flex flex-wrap gap-2">
            {HARRYPOTTER_HOUSES.map((houseConfig) => (
              <button
                key={houseConfig.id}
                type="button"
                onClick={() => {
                  const newState = {
                    ...editState,
                    harrypotter: { ...hpState, house: houseConfig.id },
                  };
                  onChange(selectedTheme, newState);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                  hpState.house === houseConfig.id
                    ? 'ring-2 ring-offset-1 ring-gray-900 bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={hpState.house === houseConfig.id}
                aria-label={`${houseConfig.name} (${houseConfig.label}) house`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={houseConfig.iconData.viewBox}
                  className="w-3.5 h-3.5"
                  style={{ fill: hpState.house === houseConfig.id ? '#FFFFFF' : houseConfig.color }}
                  aria-hidden="true"
                >
                  <path d={houseConfig.iconData.path} />
                </svg>
                {houseConfig.name}
              </button>
            ))}
          </div>
        </div>

        {/* Number inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-hp-year" className="block text-xs text-[#020912]/50 mb-1">
              Year (1-7)
            </label>
            <input
              id="edit-hp-year"
              type="number"
              min={1}
              max={7}
              value={hpState.year}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  harrypotter: { ...hpState, year: Math.min(7, Math.max(1, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
          <div>
            <label htmlFor="edit-hp-spellpower" className="block text-xs text-[#020912]/50 mb-1">
              Spell Power (0-999)
            </label>
            <input
              id="edit-hp-spellpower"
              type="number"
              min={0}
              max={999}
              value={hpState.spellPower}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  harrypotter: { ...hpState, spellPower: Math.min(999, Math.max(0, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'tarot') {
    const tarotState = editState.tarot;
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#020912]">
          {themeInfo?.name} Options
        </h3>

        {/* Arcana selection */}
        <div>
          <p className="text-xs text-[#020912]/50 mb-2">{'\uc544\ub974\uce74\ub098 \uc120\ud0dd'}</p>
          <div className="flex flex-wrap gap-2">
            {TAROT_ARCANAS.map((arcanaConfig) => (
              <button
                key={arcanaConfig.id}
                type="button"
                onClick={() => {
                  const newState = {
                    ...editState,
                    tarot: { ...tarotState, arcana: arcanaConfig.id },
                  };
                  onChange(selectedTheme, newState);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                  tarotState.arcana === arcanaConfig.id
                    ? 'ring-2 ring-offset-1 ring-gray-900 bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={tarotState.arcana === arcanaConfig.id}
                aria-label={`${arcanaConfig.name} (${arcanaConfig.label}) arcana`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={arcanaConfig.iconData.viewBox}
                  className="w-3.5 h-3.5"
                  style={{ fill: tarotState.arcana === arcanaConfig.id ? '#FFFFFF' : arcanaConfig.color }}
                  aria-hidden="true"
                >
                  <path d={arcanaConfig.iconData.path} />
                </svg>
                {arcanaConfig.name}
              </button>
            ))}
          </div>
        </div>

        {/* Number inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-tarot-cardnumber" className="block text-xs text-[#020912]/50 mb-1">
              Card Number (0-21)
            </label>
            <input
              id="edit-tarot-cardnumber"
              type="number"
              min={0}
              max={21}
              value={tarotState.cardNumber}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  tarot: { ...tarotState, cardNumber: Math.min(21, Math.max(0, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
          <div>
            <label htmlFor="edit-tarot-mystique" className="block text-xs text-[#020912]/50 mb-1">
              Mystique (0-999)
            </label>
            <input
              id="edit-tarot-mystique"
              type="number"
              min={0}
              max={999}
              value={tarotState.mystique}
              onChange={(e) => {
                const newState = {
                  ...editState,
                  tarot: { ...tarotState, mystique: Math.min(999, Math.max(0, Number(e.target.value))) },
                };
                onChange(selectedTheme, newState);
              }}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-[#020912]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'nametag') {
    return (
      <div className="border border-[rgba(2,9,18,0.15)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[#020912] mb-2">
          {themeInfo?.name} Options
        </h3>
        <p className="text-sm text-[#020912]/50">
          {'\uc774 \ud14c\ub9c8\ub294 \ubcc0\ud615 \uc635\uc158\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.'}
        </p>
        {themeInfo && (
          <p className="text-xs text-[#020912]/40 mt-2">{themeInfo.description}</p>
        )}
      </div>
    );
  }

  return null;
}
