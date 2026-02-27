'use client';

import { createContext, useContext } from 'react';
import type { CardData } from '@/types/card';
import { useCardStore } from '@/stores/useCardStore';

const CardDataContext = createContext<CardData | undefined>(undefined);

export function CardDataProvider({ card, children }: { card: CardData; children: React.ReactNode }) {
  return <CardDataContext.Provider value={card}>{children}</CardDataContext.Provider>;
}

/**
 * Hook that reads card data from context (admin preview) or store (create/edit).
 * When wrapped in CardDataProvider, returns the provided card data.
 * Otherwise, falls back to the Zustand store.
 */
export function useCardData(): CardData {
  const contextCard = useContext(CardDataContext);
  const storeCard = useCardStore((state) => state.card);
  return contextCard ?? storeCard;
}
