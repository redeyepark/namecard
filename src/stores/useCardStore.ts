import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardData, CardSide, SocialLink } from '@/types/card';

const DEFAULT_CARD: CardData = {
  front: {
    displayName: 'YOUR NAME',
    avatarImage: null,
    backgroundColor: '#E53E3E',
  },
  back: {
    fullName: 'FULL NAME',
    title: 'Your Title',
    hashtags: ['#Keyword1', '#Keyword2'],
    socialLinks: [],
    backgroundColor: '#9B2C2C',
  },
};

interface CardStore {
  card: CardData;
  activeSide: CardSide;
  updateFront: (data: Partial<CardData['front']>) => void;
  updateBack: (data: Partial<CardData['back']>) => void;
  setActiveSide: (side: CardSide) => void;
  addSocialLink: (link: SocialLink) => void;
  removeSocialLink: (index: number) => void;
  updateSocialLink: (index: number, link: SocialLink) => void;
  addHashtag: (tag: string) => void;
  removeHashtag: (index: number) => void;
  resetCard: () => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      card: DEFAULT_CARD,
      activeSide: 'front',
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
    }),
    {
      name: 'namecard-storage',
    }
  )
);
