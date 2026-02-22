import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardData, CardSide, SocialLink } from '@/types/card';

const DEFAULT_CARD: CardData = {
  front: {
    displayName: 'YOUR NAME',
    avatarImage: null,
    backgroundColor: '#020912',
  },
  back: {
    fullName: 'FULL NAME',
    title: 'Your Title',
    hashtags: ['#Keyword1', '#Keyword2'],
    socialLinks: [],
    backgroundColor: '#000000',
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
