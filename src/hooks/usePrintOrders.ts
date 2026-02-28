'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PrintOrder } from '@/types/print-order';

/**
 * Hook for managing print orders via the admin print API.
 * Provides CRUD operations and quote retrieval for Gelato print orders.
 */
export function usePrintOrders() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/print/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(async (params: {
    orderType: 'draft';
    orderReferenceId: string;
    customerReferenceId: string;
    currency: string;
    items: Array<{
      itemReferenceId: string;
      productUid: string;
      files: Array<{ type: string; url: string }>;
      quantity: number;
    }>;
    shippingAddress: Record<string, string>;
    shipmentMethodUid?: string;
  }): Promise<PrintOrder> => {
    const res = await fetch('/api/admin/print/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    const data = await res.json();
    await fetchOrders();
    return data.order;
  }, [fetchOrders]);

  const confirmOrder = useCallback(async (orderId: string): Promise<PrintOrder> => {
    const res = await fetch(`/api/admin/print/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to confirm order');
    }
    const data = await res.json();
    await fetchOrders();
    return data.order;
  }, [fetchOrders]);

  const getQuote = useCallback(async (params: {
    items: Array<{
      itemReferenceId: string;
      productUid: string;
      files: Array<{ type: string; url: string }>;
      quantity: number;
    }>;
    shippingAddress: Record<string, string>;
    currency: string;
    shipmentMethodUid?: string;
  }) => {
    const res = await fetch('/api/admin/print/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get quote');
    }
    return res.json();
  }, []);

  return { orders, isLoading, error, fetchOrders, createOrder, confirmOrder, getQuote };
}
