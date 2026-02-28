'use client';

import { useState, useCallback, useRef } from 'react';
import { usePrintOrders } from '@/hooks/usePrintOrders';
import { PrintCardSelector, type SelectedCard } from './PrintCardSelector';
import { ShippingAddressForm } from './ShippingAddressForm';
import { PrintQuoteView } from './PrintQuoteView';
import { PrintOrderHistory } from './PrintOrderHistory';
import { PrintOrderStatus } from './PrintOrderStatus';
import type { ShippingAddress, PrintOrder } from '@/types/print-order';
import type { GelatoQuoteResponse } from '@/lib/gelato-types';
import { GELATO_PRODUCT_UIDS } from '@/lib/gelato-types';

type Tab = 'new' | 'history';
type Step = 'select' | 'address' | 'quote' | 'review' | 'done';

const STEP_LABELS: Record<Step, string> = {
  select: '카드 선택',
  address: '배송 주소',
  quote: '견적 확인',
  review: '주문 확인',
  done: '완료',
};

const STEP_ORDER: Step[] = ['select', 'address', 'quote', 'review', 'done'];

/**
 * Main container orchestrating the print order flow.
 * Manages two tabs: new order wizard and order history.
 */
export function PrintOrderManager() {
  const { orders, isLoading, error, fetchOrders, createOrder, confirmOrder, getQuote } = usePrintOrders();

  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [quoteResponse, setQuoteResponse] = useState<GelatoQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedMethodUid, setSelectedMethodUid] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<PrintOrder | null>(null);

  // Stable reference for card selection callback
  const handleSelectionChange = useCallback((selected: SelectedCard[]) => {
    setSelectedCards(selected);
  }, []);

  // Step navigation
  const handleNextFromCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    setCurrentStep('address');
  }, [selectedCards]);

  const handleShippingSubmit = useCallback(async (address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep('quote');
    setQuoteLoading(true);
    setQuoteError(null);

    try {
      // Build quote items from selected cards
      // Note: PDF files must be uploaded separately. Using placeholder URLs for quote.
      const items = selectedCards.map((card) => ({
        itemReferenceId: card.cardId,
        productUid: GELATO_PRODUCT_UIDS.STANDARD,
        files: [
          { type: 'default', url: 'https://placeholder.com/pending-upload.pdf' },
        ],
        quantity: card.quantity,
      }));

      const addressObj: Record<string, string> = {
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        city: address.city,
        postCode: address.postCode,
        country: address.country,
        email: address.email,
        phone: address.phone,
      };
      if (address.companyName) addressObj.companyName = address.companyName;
      if (address.addressLine2) addressObj.addressLine2 = address.addressLine2;
      if (address.state) addressObj.state = address.state;

      const result = await getQuote({
        items,
        shippingAddress: addressObj,
        currency: 'KRW',
      });

      setQuoteResponse(result.quote ?? result);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  }, [selectedCards, getQuote]);

  const handleSelectMethod = useCallback((uid: string) => {
    setSelectedMethodUid(uid);
  }, []);

  const handleQuoteNext = useCallback(() => {
    if (!selectedMethodUid) return;
    setCurrentStep('review');
  }, [selectedMethodUid]);

  const handleCreateOrder = useCallback(async () => {
    if (!shippingAddress || selectedCards.length === 0) return;

    setOrderLoading(true);
    setOrderError(null);

    try {
      const items = selectedCards.map((card) => ({
        itemReferenceId: card.cardId,
        productUid: GELATO_PRODUCT_UIDS.STANDARD,
        files: [
          { type: 'default', url: 'https://placeholder.com/pending-upload.pdf' },
        ],
        quantity: card.quantity,
      }));

      const addressObj: Record<string, string> = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        addressLine1: shippingAddress.addressLine1,
        city: shippingAddress.city,
        postCode: shippingAddress.postCode,
        country: shippingAddress.country,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
      };
      if (shippingAddress.companyName) addressObj.companyName = shippingAddress.companyName;
      if (shippingAddress.addressLine2) addressObj.addressLine2 = shippingAddress.addressLine2;
      if (shippingAddress.state) addressObj.state = shippingAddress.state;

      const order = await createOrder({
        orderType: 'draft',
        orderReferenceId: `print-${Date.now()}`,
        customerReferenceId: 'admin',
        currency: 'KRW',
        items,
        shippingAddress: addressObj,
        ...(selectedMethodUid ? { shipmentMethodUid: selectedMethodUid } : {}),
      });

      setCreatedOrder(order);
      setCurrentStep('done');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  }, [shippingAddress, selectedCards, selectedMethodUid, createOrder]);

  const handleConfirmOrder = useCallback(async () => {
    if (!createdOrder) return;

    setOrderLoading(true);
    setOrderError(null);

    try {
      const confirmed = await confirmOrder(createdOrder.id);
      setCreatedOrder(confirmed);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to confirm order');
    } finally {
      setOrderLoading(false);
    }
  }, [createdOrder, confirmOrder]);

  const handleNewOrder = useCallback(() => {
    setCurrentStep('select');
    setSelectedCards([]);
    setShippingAddress(null);
    setQuoteResponse(null);
    setQuoteError(null);
    setSelectedMethodUid(null);
    setCreatedOrder(null);
    setOrderError(null);
  }, []);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'new'
              ? 'text-[#020912] border-[#ffa639]'
              : 'text-[#020912]/50 border-transparent hover:text-[#020912] hover:border-gray-300'
          }`}
        >
          새 주문
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'text-[#020912] border-[#ffa639]'
              : 'text-[#020912]/50 border-transparent hover:text-[#020912] hover:border-gray-300'
          }`}
        >
          주문 이력
          {orders.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'history' ? (
        <div className="bg-white border border-[rgba(2,9,18,0.15)] rounded-xl">
          <PrintOrderHistory
            orders={orders}
            onRefresh={fetchOrders}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step indicator */}
          {currentStep !== 'done' && (
            <div className="flex items-center gap-2">
              {STEP_ORDER.slice(0, -1).map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step} className="flex items-center">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCurrent
                            ? 'bg-[#ffa639] text-[#020912]'
                            : isCompleted
                              ? 'bg-[#020912] text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`text-xs ${isCurrent ? 'text-[#020912] font-medium' : 'text-gray-400'}`}>
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                    {idx < STEP_ORDER.length - 2 && (
                      <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-[#020912]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step content */}
          <div className="bg-white border border-[rgba(2,9,18,0.15)] rounded-xl p-6">
            {currentStep === 'select' && (
              <PrintCardSelector
                onSelectionChange={handleSelectionChange}
                onNext={handleNextFromCards}
                disabled={false}
              />
            )}

            {currentStep === 'address' && (
              <ShippingAddressForm
                onSubmit={handleShippingSubmit}
                onBack={() => setCurrentStep('select')}
                disabled={quoteLoading}
              />
            )}

            {currentStep === 'quote' && (
              <PrintQuoteView
                quote={quoteResponse}
                isLoading={quoteLoading}
                error={quoteError}
                onSelectMethod={handleSelectMethod}
                onBack={() => setCurrentStep('address')}
                onNext={handleQuoteNext}
                selectedMethodUid={selectedMethodUid ?? undefined}
              />
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-[#020912]">
                  주문 확인
                </h3>

                {/* PDF generation notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-yellow-800">
                        PDF 파일 안내
                      </p>
                      <p className="text-xs text-yellow-700 mt-0.5">
                        현재 주문은 임시 PDF로 생성됩니다. 실제 인쇄용 PDF는 각 카드 상세 페이지에서 개별적으로 생성한 후 Gelato 대시보드에서 교체해야 합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected cards summary */}
                <div>
                  <h4 className="text-xs font-semibold text-[#020912]/60 mb-2">
                    선택된 카드 ({selectedCards.length}개)
                  </h4>
                  <div className="space-y-1">
                    {selectedCards.map((card) => (
                      <div
                        key={card.cardId}
                        className="flex items-center justify-between text-xs px-3 py-2 bg-gray-50 rounded border border-[rgba(2,9,18,0.08)]"
                      >
                        <span className="text-[#020912] font-medium">{card.displayName}</span>
                        <span className="text-[#020912]/50">x {card.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping address summary */}
                {shippingAddress && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#020912]/60 mb-2">배송 주소</h4>
                    <div className="text-xs text-[#020912]/70 bg-gray-50 rounded border border-[rgba(2,9,18,0.08)] px-3 py-2 space-y-0.5">
                      <p>
                        {shippingAddress.lastName} {shippingAddress.firstName}
                        {shippingAddress.companyName && ` (${shippingAddress.companyName})`}
                      </p>
                      <p>{shippingAddress.addressLine1}</p>
                      {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                      <p>
                        {shippingAddress.city}
                        {shippingAddress.state && ` ${shippingAddress.state}`}
                        {' '}{shippingAddress.postCode}, {shippingAddress.country}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quote summary */}
                {quoteResponse && selectedMethodUid && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#020912]/60 mb-2">배송 방법</h4>
                    {(() => {
                      const selectedQuote = quoteResponse.quotes?.find(
                        (q) => q.shipmentMethodUid === selectedMethodUid
                      );
                      if (!selectedQuote) return null;
                      return (
                        <div className="text-xs text-[#020912]/70 bg-gray-50 rounded border border-[rgba(2,9,18,0.08)] px-3 py-2">
                          <p className="font-medium text-[#020912]">{selectedQuote.shipmentMethodName}</p>
                          <p className="text-[#020912]/50 mt-0.5">
                            {selectedQuote.minDeliveryDays}~{selectedQuote.maxDeliveryDays}일 소요
                            {' | '}
                            {new Intl.NumberFormat('ko-KR', {
                              style: 'currency',
                              currency: selectedQuote.currency,
                            }).format(selectedQuote.totalPrice)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {orderError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                    <p className="text-xs text-red-600">{orderError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('quote')}
                    disabled={orderLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={orderLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-[#020912] rounded hover:bg-[#020912]/90 transition-colors disabled:opacity-50"
                  >
                    {orderLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        주문 생성 중...
                      </span>
                    ) : (
                      '주문하기 (Draft)'
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'done' && createdOrder && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#020912]">
                    주문이 생성되었습니다
                  </h3>
                  <p className="text-sm text-[#020912]/50 mt-1">
                    Draft 상태의 주문이 생성되었습니다. 아래에서 주문을 확정하세요.
                  </p>
                </div>

                <PrintOrderStatus order={createdOrder} />

                {orderError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                    <p className="text-xs text-red-600">{orderError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleNewOrder}
                    className="flex-1 py-2.5 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] rounded hover:bg-gray-50 transition-colors"
                  >
                    새 주문
                  </button>
                  {createdOrder.orderType === 'draft' && (
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={orderLoading}
                      className="flex-1 py-2.5 text-sm font-medium text-[#020912] bg-[#ffa639] rounded hover:bg-[#ffa639]/90 transition-colors disabled:opacity-50"
                    >
                      {orderLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          확정 중...
                        </span>
                      ) : (
                        '주문 확정'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global error display */}
      {error && activeTab === 'history' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
