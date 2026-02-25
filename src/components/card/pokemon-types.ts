import type { PokemonType } from '@/types/card';

export interface PokemonTypeIconData {
  viewBox: string;
  path: string;
}

export interface PokemonTypeConfig {
  id: PokemonType;
  name: string;
  color: string;
  label: string; // Korean job category label
  iconData: PokemonTypeIconData;
}

// Inline SVG path data for each type icon (24x24 viewBox)
// Rendered as inline <svg> in components for html-to-image compatibility
const ICON_DATA: Record<PokemonType, PokemonTypeIconData> = {
  fire: {
    viewBox: '0 0 24 24',
    path: 'M12 2C10.5 5.5 7 8 7 12c0 2.8 2.2 5 5 5s5-2.2 5-5c0-1.5-.5-3-1.5-4.5C14.5 9 13 10 13 12c0 .6-.4 1-1 1s-1-.4-1-1c0-3 1.5-5.5 3-7.5C13.5 3 12.8 2.5 12 2z',
  },
  water: {
    viewBox: '0 0 24 24',
    path: 'M12 2C8 8.5 5 11 5 15c0 3.9 3.1 7 7 7s7-3.1 7-7c0-4-3-6.5-7-13zm0 18c-2.8 0-5-2.2-5-5 0-2.5 2-4.5 5-9.5 3 5 5 7 5 9.5 0 2.8-2.2 5-5 5z',
  },
  grass: {
    viewBox: '0 0 24 24',
    path: 'M17 8C8 10 5.9 16.2 3.8 19.2c-.2.3 0 .8.4.8h.2c2-1 3.8-2.2 5.4-3.6C11 18 12.5 19 14.2 19.4c.3.1.5-.1.5-.4 0-1.5-.5-3.2-1.4-4.8C15 13.5 17 12.2 19 11.4c.3-.1.4-.4.2-.7C18.5 9.5 17.8 8.7 17 8z',
  },
  electric: {
    viewBox: '0 0 24 24',
    path: 'M7 2v11h3v9l7-12h-4l4-8z',
  },
  psychic: {
    viewBox: '0 0 24 24',
    path: 'M12 2L9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6z',
  },
  steel: {
    viewBox: '0 0 24 24',
    path: 'M12 1L3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4zm0 2.2L19 7v4c0 4.5-3 8.7-7 9.9-4-1.2-7-5.4-7-9.9V7l7-3.8z',
  },
  normal: {
    viewBox: '0 0 24 24',
    path: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z',
  },
};

export const POKEMON_TYPES: PokemonTypeConfig[] = [
  { id: 'fire', name: 'Fire', color: '#FF6B35', label: 'Creative', iconData: ICON_DATA.fire },
  { id: 'water', name: 'Water', color: '#3B82F6', label: 'Tech', iconData: ICON_DATA.water },
  { id: 'grass', name: 'Grass', color: '#22C55E', label: 'Growth', iconData: ICON_DATA.grass },
  { id: 'electric', name: 'Electric', color: '#EAB308', label: 'Energy', iconData: ICON_DATA.electric },
  { id: 'psychic', name: 'Psychic', color: '#A855F7', label: 'Strategy', iconData: ICON_DATA.psychic },
  { id: 'steel', name: 'Steel', color: '#6B7280', label: 'Engineering', iconData: ICON_DATA.steel },
  { id: 'normal', name: 'Normal', color: '#9CA3AF', label: 'General', iconData: ICON_DATA.normal },
];

/**
 * Returns the type configuration for a given PokemonType.
 * Falls back to 'normal' if the type is not found.
 */
export function getPokemonTypeConfig(type: PokemonType): PokemonTypeConfig {
  return POKEMON_TYPES.find((t) => t.id === type) ?? POKEMON_TYPES[POKEMON_TYPES.length - 1];
}
