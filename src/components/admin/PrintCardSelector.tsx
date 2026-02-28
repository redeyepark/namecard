'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import type { RequestSummary } from '@/types/request';

export interface SelectedCard {
  cardId: string;
  quantity: number;
  displayName: string;
}

interface PrintCardSelectorProps {
  onSelectionChange: (selected: SelectedCard[]) => void;
  onNext?: () => void;
  disabled?: boolean;
}

/**
 * Card selection component for print ordering.
 * Displays confirmed cards with checkbox multi-select and quantity input.
 */
export function PrintCardSelector({ onSelectionChange, onNext, disabled }: PrintCardSelectorProps) {
  const [cards, setCards] = useState<RequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Fetch confirmed cards from the requests API
  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch cards');
      const data = await res.json();
      const allRequests: RequestSummary[] = data.requests ?? [];
      // Only show confirmed or delivered cards (cards ready for printing)
      const confirmedCards = allRequests.filter(
        (r) => r.status === 'confirmed' || r.status === 'delivered'
      );
      setCards(confirmedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Build selected array and notify parent whenever selection or quantities change
  const selected = useMemo(() => {
    return Array.from(selectedIds)
      .map((id) => {
        const card = cards.find((c) => c.id === id);
        if (!card) return null;
        return {
          cardId: id,
          quantity: quantities[id] ?? 100,
          displayName: card.displayName,
        };
      })
      .filter((item): item is SelectedCard => item !== null);
  }, [selectedIds, quantities, cards]);

  useEffect(() => {
    onSelectionChange(selected);
  }, [selected, onSelectionChange]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === cards.length) {
        return new Set();
      }
      return new Set(cards.map((c) => c.id));
    });
  }, [cards]);

  const handleQuantityChange = useCallback((id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setQuantities((prev) => ({ ...prev, [id]: num }));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mx-auto mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        카드 목록 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchCards}
          className="mt-2 text-sm text-[#020912]/60 hover:text-[#020912] underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">인쇄 가능한 확정된 카드가 없습니다</p>
        <p className="text-gray-400 text-xs mt-1">
          카드 상태가 &quot;확정&quot; 또는 &quot;전달완료&quot;인 카드만 인쇄 주문할 수 있습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#020912]">
          인쇄할 카드 선택
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#020912]/50">
            {selectedIds.size}개 선택됨
          </span>
          <button
            type="button"
            onClick={handleToggleAll}
            disabled={disabled}
            className="text-xs text-[#ffa639] hover:text-[#e8952f] transition-colors disabled:opacity-50"
          >
            {selectedIds.size === cards.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
      </div>

      <div className="border border-[rgba(2,9,18,0.15)] rounded-xl overflow-hidden">
        {cards.map((card, idx) => {
          const isSelected = selectedIds.has(card.id);
          const thumbnailUrl = card.illustrationUrl
            ? convertGoogleDriveUrl(card.illustrationUrl) || card.illustrationUrl
            : card.originalAvatarUrl || null;

          return (
            <div
              key={card.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#ffa639]/10' : 'hover:bg-gray-50'
              } ${idx > 0 ? 'border-t border-[rgba(2,9,18,0.08)]' : ''}`}
              onClick={() => !disabled && handleToggle(card.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!disabled) handleToggle(card.id);
                }
              }}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#020912] border-[#020912]'
                    : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Thumbnail */}
              <div className="w-10 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={`${card.displayName} thumbnail`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs text-gray-300">--</span>
                )}
              </div>

              {/* Card info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#020912] truncate">
                  {card.displayName}
                </p>
                {card.eventName && (
                  <p className="text-xs text-[#020912]/50 truncate">{card.eventName}</p>
                )}
              </div>

              {/* Quantity input */}
              {isSelected && (
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <label className="text-xs text-[#020912]/50">수량:</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={quantities[card.id] ?? 100}
                    onChange={(e) => handleQuantityChange(card.id, e.target.value)}
                    disabled={disabled}
                    className="w-20 text-sm text-center border border-[rgba(2,9,18,0.15)] rounded px-2 py-1 text-[#020912] focus:outline-none focus:border-[#020912]/40 disabled:bg-gray-50"
                    aria-label={`${card.displayName} 수량`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onNext && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNext}
            disabled={disabled || selectedIds.size === 0}
            className="w-full py-2.5 text-sm font-medium text-white bg-[#020912] rounded hover:bg-[#020912]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 ({selectedIds.size}개 카드 선택됨)
          </button>
        </div>
      )}
    </div>
  );
}
