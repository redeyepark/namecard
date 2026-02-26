import type { TarotArcana } from '@/types/card';

export interface TarotArcanaIconData {
  viewBox: string;
  path: string;
}

export interface TarotArcanaConfig {
  id: TarotArcana;
  name: string;
  color: string;       // Arcana primary color
  accent: string;      // Arcana accent color
  label: string;       // Category label
  iconData: TarotArcanaIconData;
}

// Inline SVG path data for each arcana icon (24x24 viewBox)
// Rendered as inline <svg> in components for html-to-image compatibility
const ICON_DATA: Record<TarotArcana, TarotArcanaIconData> = {
  major: {
    viewBox: '0 0 24 24',
    // Star/sun burst icon
    path: 'M12 2l2.09 6.26L20.18 9l-4.64 4.27L16.73 20 12 16.77 7.27 20l1.18-6.73L3.82 9l6.09-.74L12 2zm0 4.24L10.67 9.8l-3.85.47 2.93 2.7-.75 4.25L12 15.4l2.99 1.82-.74-4.25 2.93-2.7-3.85-.47L12 6.24z',
  },
  wands: {
    viewBox: '0 0 24 24',
    // Staff/wand with flame icon
    path: 'M12 2c-1.5 2-1.5 4 0 5.5C13.5 6 13.5 4 12 2zm-2 6.5C8.5 10 8 12 9 13.5c1.5-1 2-3 1-4.5zm4 0c-1 1.5-.5 3.5 1 4.5 1-1.5.5-3.5-1-4.5zM11 14v8h2v-8h-2zm-3 1v7h2v-7H8zm8 0v7h-2v-7h2z',
  },
  cups: {
    viewBox: '0 0 24 24',
    // Chalice/goblet icon
    path: 'M12 2C9.5 2 7.5 3.5 7 6H5c0 3.5 2.5 6.5 6 7v3H8v2h8v-2h-3v-3c3.5-.5 6-3.5 6-7h-2c-.5-2.5-2.5-4-5-4zm0 2c1.65 0 3 1.35 3 3H9c0-1.65 1.35-3 3-3zM7.05 8h9.9c-.45 2.6-2.55 4.5-4.95 4.5S7.5 10.6 7.05 8z',
  },
  swords: {
    viewBox: '0 0 24 24',
    // Crossed swords icon
    path: 'M6.92 2L2 6.92l1.41 1.41 1.42-1.41L9.17 11.25 4.58 15.83l1.42 1.42 4.58-4.59 4.34 4.34-1.42 1.42 1.42 1.41L19.83 15l-1.41-1.41-1.42 1.41-4.34-4.33 4.59-4.59-1.42-1.41L11.25 9.25 6.92 4.92 8.33 3.5 6.92 2zM17.08 2l-1.41 1.5 1.41 1.42L12.5 9.5l1.42 1.42 4.58-4.59 1.41 1.42L21.33 6.33 17.08 2z',
  },
  pentacles: {
    viewBox: '0 0 24 24',
    // Pentagon/coin with star icon
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14l-1.76 3.77L6.2 10.6l2.9 2.73-.68 4.13L12 15.4l3.58 2.06-.68-4.13 2.9-2.73-4.04-.83L12 6z',
  },
};

export const TAROT_ARCANAS: TarotArcanaConfig[] = [
  { id: 'major', name: 'Major Arcana', color: '#4A0E4E', accent: '#FFD700', label: 'Destiny', iconData: ICON_DATA.major },
  { id: 'wands', name: 'Wands', color: '#8B2500', accent: '#FF6B35', label: 'Passion', iconData: ICON_DATA.wands },
  { id: 'cups', name: 'Cups', color: '#1B4D6E', accent: '#87CEEB', label: 'Emotion', iconData: ICON_DATA.cups },
  { id: 'swords', name: 'Swords', color: '#4A4A4A', accent: '#C0C0C0', label: 'Intellect', iconData: ICON_DATA.swords },
  { id: 'pentacles', name: 'Pentacles', color: '#2E4E1E', accent: '#DAA520', label: 'Fortune', iconData: ICON_DATA.pentacles },
];

/**
 * Returns the arcana configuration for a given TarotArcana.
 * Falls back to 'major' if the arcana is not found.
 */
export function getTarotArcanaConfig(arcana: TarotArcana): TarotArcanaConfig {
  return TAROT_ARCANAS.find((a) => a.id === arcana) ?? TAROT_ARCANAS[0];
}
