import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getGelatoClient, GelatoClientError } from '@/lib/gelato';
import { getSupabase } from '@/lib/supabase';
import type { GelatoOrderRequest } from '@/lib/gelato-types';
import {
  toPrintOrder,
  type PrintOrderRow,
  type PrintOrderItemRow,
} from '@/types/print-order';

/**
 * POST /api/admin/print/orders
 * Create a new print order via Gelato and save to database.
 * Admin auth required.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'items array is required and must not be empty' },
        { status: 400 }
      );
    }
    if (!body.shippingAddress || typeof body.shippingAddress !== 'object') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'shippingAddress is required' },
        { status: 400 }
      );
    }
    if (!body.currency || typeof body.currency !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'currency is required' },
        { status: 400 }
      );
    }

    const orderReferenceId = `print-${Date.now()}`;

    const orderRequest: GelatoOrderRequest = {
      orderType: body.orderType ?? 'draft',
      orderReferenceId,
      customerReferenceId: 'admin',
      currency: body.currency,
      items: body.items,
      shippingAddress: body.shippingAddress,
      ...(body.shipmentMethodUid && { shipmentMethodUid: body.shipmentMethodUid }),
    };

    // Create order in Gelato
    const gelato = getGelatoClient();
    const gelatoOrder = await gelato.createOrder(orderRequest);

    // Save to database
    const supabase = getSupabase();

    const { data: orderRow, error: insertError } = await supabase
      .from('print_orders')
      .insert({
        gelato_order_id: gelatoOrder.id,
        status: 'draft' as const,
        order_type: orderRequest.orderType,
        shipping_address: body.shippingAddress,
        shipping_method: body.shippingMethodUid ?? null,
        quote_amount: null,
        quote_currency: body.currency,
        tracking_url: null,
        tracking_code: null,
        created_by: 'admin',
      })
      .select('*')
      .single();

    if (insertError || !orderRow) {
      return NextResponse.json(
        { error: 'Failed to save order to database', details: insertError?.message },
        { status: 500 }
      );
    }

    // Save order items
    const itemInserts = body.items.map((item: { itemReferenceId: string; productUid: string; quantity: number; files?: { type: string; url: string }[] }) => ({
      print_order_id: orderRow.id,
      card_request_id: item.itemReferenceId,
      product_uid: item.productUid,
      quantity: item.quantity,
      front_pdf_url: item.files?.find((f: { type: string }) => f.type === 'front')?.url ?? null,
      back_pdf_url: item.files?.find((f: { type: string }) => f.type === 'back')?.url ?? null,
    }));

    const { data: itemRows, error: itemError } = await supabase
      .from('print_order_items')
      .insert(itemInserts)
      .select('*');

    if (itemError) {
      return NextResponse.json(
        { error: 'Failed to save order items', details: itemError.message },
        { status: 500 }
      );
    }

    const printOrder = toPrintOrder(
      orderRow as PrintOrderRow,
      (itemRows ?? []) as PrintOrderItemRow[]
    );

    return NextResponse.json({ order: printOrder }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof GelatoClientError) {
      return NextResponse.json(
        { error: 'Gelato API error', details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/print/orders
 * List all print orders from the database.
 * Admin auth required.
 */
export async function GET() {
  try {
    await requireAdminToken();

    const supabase = getSupabase();

    const { data: orderRows, error: ordersError } = await supabase
      .from('print_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Fetch items for all orders
    const orderIds = orderRows.map((r: PrintOrderRow) => r.id);
    const { data: allItems, error: itemsError } = await supabase
      .from('print_order_items')
      .select('*')
      .in('print_order_id', orderIds);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Group items by order ID
    const itemsByOrderId = new Map<string, PrintOrderItemRow[]>();
    for (const item of (allItems ?? []) as PrintOrderItemRow[]) {
      const existing = itemsByOrderId.get(item.print_order_id) ?? [];
      existing.push(item);
      itemsByOrderId.set(item.print_order_id, existing);
    }

    const orders = (orderRows as PrintOrderRow[]).map((row) =>
      toPrintOrder(row, itemsByOrderId.get(row.id) ?? [])
    );

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
