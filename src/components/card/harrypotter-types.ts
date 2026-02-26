import type { HarrypotterHouse } from '@/types/card';

export interface HarrypotterHouseIconData {
  viewBox: string;
  path: string;
}

export interface HarrypotterHouseConfig {
  id: HarrypotterHouse;
  name: string;
  color: string;       // House primary color
  accent: string;      // House accent color
  label: string;       // Category label
  iconData: HarrypotterHouseIconData;
}

// Inline SVG path data for each house icon (24x24 viewBox)
// Rendered as inline <svg> in components for html-to-image compatibility
const ICON_DATA: Record<HarrypotterHouse, HarrypotterHouseIconData> = {
  gryffindor: {
    viewBox: '0 0 24 24',
    // Lion icon
    path: 'M12 2C10.5 4 8 5 6 5.5c0 2 .5 4 2 5.5-1 1-1.5 2.5-1.5 4 0 1 .3 2 .8 2.8C8 19 9.5 20.5 12 22c2.5-1.5 4-3 4.7-4.2.5-.8.8-1.8.8-2.8 0-1.5-.5-3-1.5-4 1.5-1.5 2-3.5 2-5.5-2-.5-4.5-1.5-6-3.5zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 12c-1.7 0-3-1-3.5-2.5.7.3 1.5.5 2.3.5h2.4c.8 0 1.6-.2 2.3-.5-.5 1.5-1.8 2.5-3.5 2.5z',
  },
  slytherin: {
    viewBox: '0 0 24 24',
    // Serpent icon
    path: 'M20 4c-1 0-2 .5-3 1.5C16 4.5 14.5 4 13 4c-2 0-3.5 1-4.5 2.5C7.5 5.5 6 5 4.5 5 3 5 2 6 2 7.5c0 2 1.5 3.5 3 4.5-1 1.5-1.5 3-1.5 4.5 0 2.5 2 4.5 4.5 4.5 1.5 0 3-.5 4-1.5 1 1 2.5 1.5 4 1.5 2.5 0 4.5-2 4.5-4.5 0-1.5-.5-3-1.5-4.5 1.5-1 3-2.5 3-4.5C22 5 21 4 20 4zm-8 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-3-8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z',
  },
  hufflepuff: {
    viewBox: '0 0 24 24',
    // Badger icon
    path: 'M12 2C9 2 6.5 3.5 5 6c-.5 1-1 2-1 3.5 0 1.5.5 3 1.5 4C4.5 15 4 16.5 4 18c0 2.2 1.8 4 4 4 1.5 0 2.8-.8 3.5-2h1c.7 1.2 2 2 3.5 2 2.2 0 4-1.8 4-4 0-1.5-.5-3-1.5-4.5 1-1 1.5-2.5 1.5-4 0-1.5-.5-2.5-1-3.5C17.5 3.5 15 2 12 2zm-3 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-3 6c-1.1 0-2-.5-2.5-1.2.5.1 1 .2 1.5.2h2c.5 0 1-.1 1.5-.2-.5.7-1.4 1.2-2.5 1.2z',
  },
  ravenclaw: {
    viewBox: '0 0 24 24',
    // Eagle icon
    path: 'M12 2L8 6l-4-1c0 3 1 5.5 3 7.5C5.5 14 5 16 5 18c0 2 1.5 4 4 4 1.2 0 2.2-.5 3-1.3.8.8 1.8 1.3 3 1.3 2.5 0 4-2 4-4 0-2-.5-4-2-5.5 2-2 3-4.5 3-7.5l-4 1-4-4zm0 4l2 2h-4l2-2zm-3 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
  },
};

export const HARRYPOTTER_HOUSES: HarrypotterHouseConfig[] = [
  { id: 'gryffindor', name: 'Gryffindor', color: '#740001', accent: '#D3A625', label: 'Leadership', iconData: ICON_DATA.gryffindor },
  { id: 'slytherin', name: 'Slytherin', color: '#1A472A', accent: '#5D5D5D', label: 'Strategy', iconData: ICON_DATA.slytherin },
  { id: 'hufflepuff', name: 'Hufflepuff', color: '#FFD800', accent: '#000000', label: 'Dedication', iconData: ICON_DATA.hufflepuff },
  { id: 'ravenclaw', name: 'Ravenclaw', color: '#0E1A40', accent: '#946B2D', label: 'Wisdom', iconData: ICON_DATA.ravenclaw },
];

/**
 * Returns the house configuration for a given HarrypotterHouse.
 * Falls back to 'gryffindor' if the house is not found.
 */
export function getHarrypotterHouseConfig(house: HarrypotterHouse): HarrypotterHouseConfig {
  return HARRYPOTTER_HOUSES.find((h) => h.id === house) ?? HARRYPOTTER_HOUSES[0];
}
