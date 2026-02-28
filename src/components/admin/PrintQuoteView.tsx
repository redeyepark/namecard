'use client';

import { useState } from 'react';
import type { GelatoQuoteResponse, GelatoQuote } from '@/lib/gelato-types';

interface PrintQuoteViewProps {
  quote: GelatoQuoteResponse | null;
  isLoading: boolean;
  error?: string | null;
  onSelectMethod: (shipmentMethodUid: string) => void;
  onBack?: () => void;
  onNext?: () => void;
  selectedMethodUid?: string;
}

/**
 * Display Gelato quote results with selectable shipping methods.
 * Shows price, delivery time, and method name for each option.
 */
export function PrintQuoteView({
  quote,
  isLoading,
  error,
  onSelectMethod,
  onBack,
  onNext,
  selectedMethodUid,
}: PrintQuoteViewProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(selectedMethodUid ?? null);

  const handleSelect = (uid: string) => {
    setLocalSelected(uid);
    onSelectMethod(uid);
  };

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
        견적 조회 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!quote || !quote.quotes || quote.quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">견적 정보가 없습니다</p>
        <p className="text-gray-400 text-xs mt-1">
          카드 선택과 배송 주소를 확인한 후 다시 시도하세요
        </p>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency,
      }).format(price);
    } catch {
      return `${currency} ${price.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#020912]">
        배송 방법 선택
      </h3>

      <div className="space-y-2">
        {quote.quotes.map((q: GelatoQuote) => {
          const isSelected = localSelected === q.shipmentMethodUid;

          return (
            <button
              key={q.shipmentMethodUid}
              type="button"
              onClick={() => handleSelect(q.shipmentMethodUid)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                isSelected
                  ? 'border-[#020912] bg-[#020912]/5'
                  : 'border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.3)]'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#020912]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#020912]" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#020912]">
                      {q.shipmentMethodName}
                    </p>
                    <p className="text-xs text-[#020912]/50 mt-0.5">
                      {q.minDeliveryDays === q.maxDeliveryDays
                        ? `${q.minDeliveryDays}일 소요`
                        : `${q.minDeliveryDays}~${q.maxDeliveryDays}일 소요`}
                      {q.fulfillmentCountry && ` | ${q.fulfillmentCountry}`}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-bold text-[#020912]">
                  {formatPrice(q.totalPrice, q.currency)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2.5 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] rounded hover:bg-gray-50 transition-colors"
          >
            이전
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!localSelected}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-[#020912] rounded hover:bg-[#020912]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
