import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardData, CardSide, CardTheme, PokemonType, HearthstoneClass, HarrypotterHouse, TarotArcana, SocialLink } from '@/types/card';
import { isBuiltinTheme } from '@/types/card';

const DEFAULT_CARD: CardData = {
  front: {
    displayName: 'YOUR NAME',
    avatarImage: null,
    backgroundColor: '#b21b3c',
    textColor: '#FFFFFF',
  },
  back: {
    fullName: 'FULL NAME',
    title: 'Your Title',
    hashtags: ['#Keyword1', '#Keyword2'],
    socialLinks: [],
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
  },
};

interface CardStore {
  card: CardData;
  activeSide: CardSide;
  wizardStep: number;
  wizardCompleted: boolean;
  updateFront: (data: Partial<CardData['front']>) => void;
  updateBack: (data: Partial<CardData['back']>) => void;
  setActiveSide: (side: CardSide) => void;
  addSocialLink: (link: SocialLink) => void;
  removeSocialLink: (index: number) => void;
  updateSocialLink: (index: number, link: SocialLink) => void;
  addHashtag: (tag: string) => void;
  removeHashtag: (index: number) => void;
  resetCard: () => void;
  setTheme: (theme: CardTheme) => void;
  setPokemonType: (type: PokemonType) => void;
  setPokemonExp: (exp: number) => void;
  setHearthstoneClass: (classType: HearthstoneClass) => void;
  setHearthstoneMana: (mana: number) => void;
  setHearthstoneAttack: (attack: number) => void;
  setHearthstoneHealth: (health: number) => void;
  setHarrypotterHouse: (house: HarrypotterHouse) => void;
  setHarrypotterYear: (year: number) => void;
  setHarrypotterSpellPower: (spellPower: number) => void;
  setTarotArcana: (arcana: TarotArcana) => void;
  setTarotCardNumber: (cardNumber: number) => void;
  setTarotMystique: (mystique: number) => void;
  setCustomThemeMeta: (key: string, value: string | number) => void;
  removeCustomThemeMeta: (key: string) => void;
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      card: DEFAULT_CARD,
      activeSide: 'front',
      wizardStep: 1,
      wizardCompleted: false,
      updateFront: (data) =>
        set((state) => ({
          card: { ...state.card, front: { ...state.card.front, ...data } },
        })),
      updateBack: (data) =>
        set((state) => ({
          card: { ...state.card, back: { ...state.card.back, ...data } },
        })),
      setActiveSide: (side) => set({ activeSide: side }),
      addSocialLink: (link) =>
        set((state) => ({
          card: {
            ...state.card,
            back: {
              ...state.card.back,
              socialLinks: [...state.card.back.socialLinks, link],
            },
          },
        })),
      removeSocialLink: (index) =>
        set((state) => ({
          card: {
            ...state.card,
            back: {
              ...state.card.back,
              socialLinks: state.card.back.socialLinks.filter((_, i) => i !== index),
            },
          },
        })),
      updateSocialLink: (index, link) =>
        set((state) => ({
          card: {
            ...state.card,
            back: {
              ...state.card.back,
              socialLinks: state.card.back.socialLinks.map((l, i) =>
                i === index ? link : l
              ),
            },
          },
        })),
      addHashtag: (tag) =>
        set((state) => ({
          card: {
            ...state.card,
            back: {
              ...state.card.back,
              hashtags: [...state.card.back.hashtags, tag],
            },
          },
        })),
      removeHashtag: (index) =>
        set((state) => ({
          card: {
            ...state.card,
            back: {
              ...state.card.back,
              hashtags: state.card.back.hashtags.filter((_, i) => i !== index),
            },
          },
        })),
      resetCard: () => set({ card: DEFAULT_CARD }),
      setTheme: (theme) =>
        set((state) => {
          const updatedCard = { ...state.card, theme };
          // Auto-create default pokemonMeta when switching to 'pokemon' if none exists
          if (theme === 'pokemon' && !state.card.pokemonMeta) {
            updatedCard.pokemonMeta = { type: 'electric', exp: 100 };
          }
          // Auto-create default hearthstoneMeta when switching to 'hearthstone' if none exists
          if (theme === 'hearthstone' && !state.card.hearthstoneMeta) {
            updatedCard.hearthstoneMeta = { classType: 'warrior', mana: 3, attack: 2, health: 5 };
          }
          // Auto-create default harrypotterMeta when switching to 'harrypotter' if none exists
          if (theme === 'harrypotter' && !state.card.harrypotterMeta) {
            updatedCard.harrypotterMeta = { house: 'gryffindor', year: 1, spellPower: 100 };
          }
          // Auto-create default tarotMeta when switching to 'tarot' if none exists
          if (theme === 'tarot' && !state.card.tarotMeta) {
            updatedCard.tarotMeta = { arcana: 'major', cardNumber: 0, mystique: 100 };
          }
          // Auto-create empty customThemeMeta when switching to a custom (non-builtin) theme
          if (!isBuiltinTheme(theme) && !state.card.customThemeMeta) {
            updatedCard.customThemeMeta = {};
          }
          return { card: updatedCard };
        }),
      setPokemonType: (type) =>
        set((state) => ({
          card: {
            ...state.card,
            pokemonMeta: {
              ...(state.card.pokemonMeta ?? { type: 'electric', exp: 100 }),
              type,
            },
          },
        })),
      setPokemonExp: (exp) =>
        set((state) => ({
          card: {
            ...state.card,
            pokemonMeta: {
              ...(state.card.pokemonMeta ?? { type: 'electric', exp: 100 }),
              exp: Math.max(0, Math.min(999, exp)),
            },
          },
        })),
      setHearthstoneClass: (classType) =>
        set((state) => ({
          card: {
            ...state.card,
            hearthstoneMeta: {
              ...(state.card.hearthstoneMeta ?? { classType: 'warrior', mana: 3, attack: 2, health: 5 }),
              classType,
            },
          },
        })),
      setHearthstoneMana: (mana) =>
        set((state) => ({
          card: {
            ...state.card,
            hearthstoneMeta: {
              ...(state.card.hearthstoneMeta ?? { classType: 'warrior', mana: 3, attack: 2, health: 5 }),
              mana: Math.max(0, Math.min(10, mana)),
            },
          },
        })),
      setHearthstoneAttack: (attack) =>
        set((state) => ({
          card: {
            ...state.card,
            hearthstoneMeta: {
              ...(state.card.hearthstoneMeta ?? { classType: 'warrior', mana: 3, attack: 2, health: 5 }),
              attack: Math.max(0, Math.min(12, attack)),
            },
          },
        })),
      setHearthstoneHealth: (health) =>
        set((state) => ({
          card: {
            ...state.card,
            hearthstoneMeta: {
              ...(state.card.hearthstoneMeta ?? { classType: 'warrior', mana: 3, attack: 2, health: 5 }),
              health: Math.max(1, Math.min(12, health)),
            },
          },
        })),
      setHarrypotterHouse: (house) =>
        set((state) => ({
          card: {
            ...state.card,
            harrypotterMeta: {
              ...(state.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 }),
              house,
            },
          },
        })),
      setHarrypotterYear: (year) =>
        set((state) => ({
          card: {
            ...state.card,
            harrypotterMeta: {
              ...(state.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 }),
              year: Math.max(1, Math.min(7, year)),
            },
          },
        })),
      setHarrypotterSpellPower: (spellPower) =>
        set((state) => ({
          card: {
            ...state.card,
            harrypotterMeta: {
              ...(state.card.harrypotterMeta ?? { house: 'gryffindor', year: 1, spellPower: 100 }),
              spellPower: Math.max(0, Math.min(999, spellPower)),
            },
          },
        })),
      setTarotArcana: (arcana) =>
        set((state) => ({
          card: {
            ...state.card,
            tarotMeta: {
              ...(state.card.tarotMeta ?? { arcana: 'major', cardNumber: 0, mystique: 100 }),
              arcana,
            },
          },
        })),
      setTarotCardNumber: (cardNumber) =>
        set((state) => ({
          card: {
            ...state.card,
            tarotMeta: {
              ...(state.card.tarotMeta ?? { arcana: 'major', cardNumber: 0, mystique: 100 }),
              cardNumber: Math.max(0, Math.min(21, cardNumber)),
            },
          },
        })),
      setTarotMystique: (mystique) =>
        set((state) => ({
          card: {
            ...state.card,
            tarotMeta: {
              ...(state.card.tarotMeta ?? { arcana: 'major', cardNumber: 0, mystique: 100 }),
              mystique: Math.max(0, Math.min(999, mystique)),
            },
          },
        })),
      setCustomThemeMeta: (key, value) =>
        set((state) => ({
          card: {
            ...state.card,
            customThemeMeta: {
              ...(state.card.customThemeMeta ?? {}),
              [key]: value,
            },
          },
        })),
      removeCustomThemeMeta: (key) =>
        set((state) => {
          const current = { ...(state.card.customThemeMeta ?? {}) };
          delete current[key];
          return {
            card: {
              ...state.card,
              customThemeMeta: current,
            },
          };
        }),
      setWizardStep: (step) =>
        set({ wizardStep: Math.max(1, Math.min(5, step)) }),
      nextStep: () =>
        set((state) => {
          const next = Math.min(5, state.wizardStep + 1);
          return {
            wizardStep: next,
            wizardCompleted: next === 5 ? true : state.wizardCompleted,
          };
        }),
      prevStep: () =>
        set((state) => ({
          wizardStep: Math.max(1, state.wizardStep - 1),
        })),
      resetWizard: () =>
        set({ wizardStep: 1, wizardCompleted: false, card: DEFAULT_CARD }),
    }),
    {
      name: 'namecard-storage',
    }
  )
);
