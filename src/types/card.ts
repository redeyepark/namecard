export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'email' | 'phone' | 'youtube' | 'custom';
  url: string;
  label: string;
}

export interface CardFrontData {
  displayName: string;
  avatarImage: string | null;
  backgroundColor: string;
  textColor: string;
}

export interface CardBackData {
  fullName: string;
  title: string;
  hashtags: string[];
  socialLinks: SocialLink[];
  backgroundColor: string;
  textColor: string;
}

export type CardTheme = 'classic' | 'pokemon' | 'hearthstone' | 'harrypotter';
export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'steel' | 'normal';
export type HearthstoneClass = 'warrior' | 'mage' | 'rogue' | 'priest' | 'hunter' | 'paladin' | 'shaman' | 'warlock' | 'druid';
export type HarrypotterHouse = 'gryffindor' | 'slytherin' | 'hufflepuff' | 'ravenclaw';

export interface PokemonMeta {
  type: PokemonType;
  exp: number; // 0-999
}

export interface HearthstoneMeta {
  classType: HearthstoneClass;
  mana: number;    // 0-10
  attack: number;  // 0-12
  health: number;  // 1-12
}

export interface HarrypotterMeta {
  house: HarrypotterHouse;
  year: number;        // 1-7 (Hogwarts year)
  spellPower: number;  // 0-999
}

export interface CardData {
  front: CardFrontData;
  back: CardBackData;
  theme?: CardTheme;                 // default: 'classic'
  pokemonMeta?: PokemonMeta;         // only when theme === 'pokemon'
  hearthstoneMeta?: HearthstoneMeta; // only when theme === 'hearthstone'
  harrypotterMeta?: HarrypotterMeta; // only when theme === 'harrypotter'
}

export type CardSide = 'front' | 'back';
