import type { HearthstoneClass } from '@/types/card';

export interface HearthstoneClassIconData {
  viewBox: string;
  path: string;
}

export interface HearthstoneClassConfig {
  id: HearthstoneClass;
  name: string;
  color: string;       // Class accent color
  label: string;       // Korean job category label
  iconData: HearthstoneClassIconData;
}

// Inline SVG path data for each class icon (24x24 viewBox)
// Rendered as inline <svg> in components for html-to-image compatibility
const ICON_DATA: Record<HearthstoneClass, HearthstoneClassIconData> = {
  warrior: {
    viewBox: '0 0 24 24',
    // Sword icon
    path: 'M6.92 5L5 6.92l5.79 5.79L5.5 18H2v2h5.5l5.29-5.29L18.08 20 20 18.08 6.92 5zM20.5 2H18l-3 3 2.5 2.5L20.5 2z',
  },
  mage: {
    viewBox: '0 0 24 24',
    // Staff/crystal icon
    path: 'M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7zm0 4.5L13.5 10l3.5 1.5-3.5 1.5L12 16.5 10.5 13 7 11.5 10.5 10 12 6.5z',
  },
  rogue: {
    viewBox: '0 0 24 24',
    // Dagger icon
    path: 'M2 22l4-4 3 3 4-4-3-3L20 4l-2-2-10 10-3-3-4 4 3 3-4 4 2 2zm14.5-15.5l1 1-8 8-1-1 8-8z',
  },
  priest: {
    viewBox: '0 0 24 24',
    // Cross/holy icon
    path: 'M10 2v6H4v4h6v10h4V12h6V8h-6V2h-4z',
  },
  hunter: {
    viewBox: '0 0 24 24',
    // Bow/arrow icon
    path: 'M2.5 2.5l3 3L2 12l4.5 4.5L12 22l6.5-6.5L22 12l-3.5-6.5L12 2 5.5 5.5l-3-3zm9.5 4l4.5 4.5-4.5 4.5-4.5-4.5L12 6.5zm-6.5 5L7 10l5 5-1.5 1.5L5.5 11.5zm8 3L15 10l3 1.5-5 5z',
  },
  paladin: {
    viewBox: '0 0 24 24',
    // Hammer icon
    path: 'M7 2v2h1v3.17L4.83 10.34 3.41 8.93 2 10.34l3.17 3.17L6 14.34V22h2v-7.66l.83-.83L12 16.68l3.17-3.17L16 14.34V22h2v-7.66l.83-.83L22 10.34l-1.41-1.41-1.42 1.41L16 7.17V4h1V2H7z',
  },
  shaman: {
    viewBox: '0 0 24 24',
    // Totem/lightning icon
    path: 'M11 2L6 10h4l-3 6h3l-4 6 8-8h-4l4-6h-3.5L15 2h-4zm1 4.5L10.5 9H14l-3 5h-2l3-5H8.5L11 4h2l-1 2.5z',
  },
  warlock: {
    viewBox: '0 0 24 24',
    // Demon eye/fire icon
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13v2h2V7h-2zm0 4v6h2v-6h-2z',
  },
  druid: {
    viewBox: '0 0 24 24',
    // Claw/leaf icon
    path: 'M17 8C8 10 5.9 16.2 3.8 19.2c-.2.3 0 .8.4.8h.2c2-1 3.8-2.2 5.4-3.6C11 18 12.5 19 14.2 19.4c.3.1.5-.1.5-.4 0-1.5-.5-3.2-1.4-4.8C15 13.5 17 12.2 19 11.4c.3-.1.4-.4.2-.7C18.5 9.5 17.8 8.7 17 8z',
  },
};

export const HEARTHSTONE_CLASSES: HearthstoneClassConfig[] = [
  { id: 'warrior', name: 'Warrior', color: '#C41E3A', label: 'Leadership', iconData: ICON_DATA.warrior },
  { id: 'mage', name: 'Mage', color: '#3FC7EB', label: 'Tech', iconData: ICON_DATA.mage },
  { id: 'rogue', name: 'Rogue', color: '#555555', label: 'Strategy', iconData: ICON_DATA.rogue },
  { id: 'priest', name: 'Priest', color: '#F0EBE0', label: 'Support', iconData: ICON_DATA.priest },
  { id: 'hunter', name: 'Hunter', color: '#AAD372', label: 'Marketing', iconData: ICON_DATA.hunter },
  { id: 'paladin', name: 'Paladin', color: '#F48CBA', label: 'Management', iconData: ICON_DATA.paladin },
  { id: 'shaman', name: 'Shaman', color: '#0070DD', label: 'Engineering', iconData: ICON_DATA.shaman },
  { id: 'warlock', name: 'Warlock', color: '#8788EE', label: 'Creative', iconData: ICON_DATA.warlock },
  { id: 'druid', name: 'Druid', color: '#FF7C0A', label: 'Growth', iconData: ICON_DATA.druid },
];

/**
 * Returns the class configuration for a given HearthstoneClass.
 * Falls back to 'warrior' if the class is not found.
 */
export function getHearthstoneClassConfig(classType: HearthstoneClass): HearthstoneClassConfig {
  return HEARTHSTONE_CLASSES.find((c) => c.id === classType) ?? HEARTHSTONE_CLASSES[0];
}
