'use client';

import { useState, useMemo, useCallback } from 'react';
import type { PrintOrder, PrintStatus } from '@/types/print-order';
import { PrintStatusBadge } from './PrintOrderStatus';
import { PrintOrderStatus } from './PrintOrderStatus';

interface PrintOrderHistoryProps {
  orders: PrintOrder[];
  onRefresh: () => void;
  isLoading?: boolean;
}

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'pending', label: '대기중' },
  { value: 'production', label: '제작중' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소됨' },
  { value: 'failed', label: '실패' },
];

/**
 * Past orders list with expandable detail view and status filter.
 */
export function PrintOrderHistory({ orders, onRefresh, isLoading }: PrintOrderHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const formatPrice = (amount: number | null, currency: string | null) => {
    if (amount === null) return '-';
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: currency || 'KRW',
      }).format(amount);
    } catch {
      return `${currency || ''} ${amount.toFixed(2)}`;
    }
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
        주문 목록 로딩 중...
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-[#020912]/60">상태:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-[rgba(2,9,18,0.15)] rounded bg-white px-2 py-1 text-[#020912] focus:outline-none focus:border-[#020912]/40"
            aria-label="상태 필터"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            {filteredOrders.length}건
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="text-xs text-[#020912]/60 hover:text-[#020912] transition-colors flex items-center gap-1"
          aria-label="새로고침"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            {statusFilter ? '해당 상태의 주문이 없습니다' : '주문 이력이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60 w-8" />
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60">주문 ID</th>
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60">상태</th>
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60">카드 수</th>
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60">금액</th>
                <th className="text-left py-3 px-4 font-medium text-[#020912]/60">생성일</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isExpanded = expandedId === order.id;
                const date = new Date(order.createdAt);
                const formatted = date.toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isExpanded={isExpanded}
                    onToggle={() => handleToggleExpand(order.id)}
                    formattedDate={formatted}
                    formatPrice={formatPrice}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Separated into a sub-component to keep rendering clean
function OrderRow({
  order,
  isExpanded,
  onToggle,
  formattedDate,
  formatPrice,
}: {
  order: PrintOrder;
  isExpanded: boolean;
  onToggle: () => void;
  formattedDate: string;
  formatPrice: (amount: number | null, currency: string | null) => string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff] cursor-pointer transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
      >
        <td className="py-3 px-4">
          <svg
            className={`w-4 h-4 text-[#020912]/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </td>
        <td className="py-3 px-4 font-mono text-xs text-gray-600">
          {order.id.slice(0, 8)}...
        </td>
        <td className="py-3 px-4">
          <PrintStatusBadge status={order.status} />
        </td>
        <td className="py-3 px-4 text-[#020912]/70">
          {order.items.length}
        </td>
        <td className="py-3 px-4 text-[#020912]/70">
          {formatPrice(order.quoteAmount, order.quoteCurrency)}
        </td>
        <td className="py-3 px-4 text-[#020912]/50">
          {formattedDate}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-4">
            <div className="space-y-4">
              {/* Status timeline */}
              <PrintOrderStatus order={order} />

              {/* Items list */}
              <div>
                <h4 className="text-xs font-semibold text-[#020912]/60 mb-2">주문 항목</h4>
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs px-3 py-2 bg-white rounded border border-[rgba(2,9,18,0.08)]"
                    >
                      <span className="text-[#020912] font-mono">
                        {item.cardRequestId.slice(0, 8)}...
                      </span>
                      <span className="text-[#020912]/50">
                        수량: {item.quantity}
                      </span>
                      <span className="text-[#020912]/50 font-mono text-[10px]">
                        {item.productUid.slice(0, 20)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping info */}
              {order.shippingAddress && (
                <div>
                  <h4 className="text-xs font-semibold text-[#020912]/60 mb-2">배송 정보</h4>
                  <div className="text-xs text-[#020912]/70 bg-white rounded border border-[rgba(2,9,18,0.08)] px-3 py-2 space-y-0.5">
                    <p>
                      {order.shippingAddress.lastName} {order.shippingAddress.firstName}
                      {order.shippingAddress.companyName && ` (${order.shippingAddress.companyName})`}
                    </p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p>{order.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.state && ` ${order.shippingAddress.state}`}
                      {' '}{order.shippingAddress.postCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="mt-1 text-[#020912]/50">
                      {order.shippingAddress.email} | {order.shippingAddress.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Gelato order ID */}
              {order.gelatoOrderId && (
                <p className="text-[10px] text-[#020912]/30 font-mono">
                  Gelato ID: {order.gelatoOrderId}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
