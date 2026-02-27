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

export type BuiltinTheme = 'classic' | 'pokemon' | 'hearthstone' | 'harrypotter' | 'tarot' | 'nametag' | 'snsprofile';

export const BUILTIN_THEMES: BuiltinTheme[] = ['classic', 'pokemon', 'hearthstone', 'harrypotter', 'tarot', 'nametag', 'snsprofile'];

export function isBuiltinTheme(theme: string): theme is BuiltinTheme {
  return (BUILTIN_THEMES as string[]).includes(theme);
}

export type CardTheme = BuiltinTheme | (string & {});
export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'steel' | 'normal';
export type HearthstoneClass = 'warrior' | 'mage' | 'rogue' | 'priest' | 'hunter' | 'paladin' | 'shaman' | 'warlock' | 'druid';
export type HarrypotterHouse = 'gryffindor' | 'slytherin' | 'hufflepuff' | 'ravenclaw';
export type TarotArcana = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

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

export interface TarotMeta {
  arcana: TarotArcana;
  cardNumber: number;  // 0-21 (tarot card number)
  mystique: number;    // 0-999 (mystical power level)
}

export interface CardData {
  front: CardFrontData;
  back: CardBackData;
  theme?: CardTheme;                 // default: 'classic'
  pokemonMeta?: PokemonMeta;         // only when theme === 'pokemon'
  hearthstoneMeta?: HearthstoneMeta; // only when theme === 'hearthstone'
  harrypotterMeta?: HarrypotterMeta; // only when theme === 'harrypotter'
  tarotMeta?: TarotMeta;             // only when theme === 'tarot'
  customThemeMeta?: Record<string, string | number>; // only when theme is a custom (non-builtin) theme
}

export type CardSide = 'front' | 'back';

/**
 * Public card data exposed via /api/cards/[id].
 * Excludes created_by (user email) for privacy.
 */
export interface PublicCardData {
  id: string;
  card: CardData;
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  theme: CardTheme;
  likeCount: number;
  /** Creator user ID (for profile link) */
  userId?: string | null;
  /** Creator display name */
  userDisplayName?: string | null;
  /** Creator avatar URL */
  userAvatarUrl?: string | null;
  /** Card creation date (ISO string) */
  createdAt?: string | null;
}

/**
 * Lightweight card data for the gallery grid view.
 * Contains only the fields needed for thumbnail rendering.
 * Excludes created_by (user email) for privacy.
 */
export interface GalleryCardData {
  id: string;
  displayName: string;
  title: string;
  theme: CardTheme;
  illustrationUrl: string | null;
  originalAvatarUrl: string | null;
  status: string;
  likeCount: number;
}

/**
 * A group of cards belonging to the same event, used in the gallery view.
 */
export interface GalleryEventGroup {
  eventId: string | null;
  eventName: string;
  eventDate?: string;
  cards: GalleryCardData[];
}

/**
 * Response shape for the gallery endpoint with event-grouped cards.
 */
export interface GalleryResponse {
  groups: GalleryEventGroup[];
  totalCards: number;
}

/**
 * Extension of GalleryCardData for the community feed with user info.
 * Includes user profile data and like count for social features.
 */
export interface FeedCardData extends GalleryCardData {
  userId: string | null;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  likeCount: number;
}

/**
 * Cursor-based paginated response for the community feed.
 */
export interface FeedResponse {
  cards: FeedCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}
