import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getGelatoClient, GelatoClientError } from '@/lib/gelato';
import { getSupabase } from '@/lib/supabase';
import {
  toPrintOrder,
  type PrintOrderRow,
  type PrintOrderItemRow,
} from '@/types/print-order';

/**
 * GET /api/admin/print/orders/[id]
 * Get a single print order by ID.
 * If the order has a gelatoOrderId, also fetch latest status from Gelato API
 * and update the DB.
 * Admin auth required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const supabase = getSupabase();

    // Fetch order from DB
    const { data: orderRow, error: orderError } = await supabase
      .from('print_orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: 'Failed to fetch order', details: orderError.message },
        { status: 500 }
      );
    }

    if (!orderRow) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const typedRow = orderRow as PrintOrderRow;

    // If we have a Gelato order ID, sync latest status
    if (typedRow.gelato_order_id) {
      try {
        const gelato = getGelatoClient();
        const gelatoStatus = await gelato.getOrder(typedRow.gelato_order_id);

        // Map Gelato fulfillment status to our PrintStatus
        const statusMap: Record<string, string> = {
          created: 'draft',
          passed: 'pending',
          in_production: 'production',
          shipped: 'shipped',
          delivered: 'delivered',
          canceled: 'cancelled',
          cancelled: 'cancelled',
        };
        const mappedStatus = statusMap[gelatoStatus.fulfillmentStatus] ?? typedRow.status;

        // Extract tracking info from first shipment if available
        const shipment = gelatoStatus.shipments?.[0];
        const trackingUrl = shipment?.trackingUrl ?? typedRow.tracking_url;
        const trackingCode = shipment?.trackingCode ?? typedRow.tracking_code;

        // Update DB if status or tracking changed
        if (
          mappedStatus !== typedRow.status ||
          trackingUrl !== typedRow.tracking_url ||
          trackingCode !== typedRow.tracking_code
        ) {
          await supabase
            .from('print_orders')
            .update({
              status: mappedStatus,
              tracking_url: trackingUrl,
              tracking_code: trackingCode,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          typedRow.status = mappedStatus as PrintOrderRow['status'];
          typedRow.tracking_url = trackingUrl;
          typedRow.tracking_code = trackingCode;
        }
      } catch (error) {
        // Log but do not fail - return DB data even if Gelato is unreachable
        console.error('[print/orders/[id]] Failed to sync Gelato status:', error);
      }
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('print_order_items')
      .select('*')
      .eq('print_order_id', id);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: itemsError.message },
        { status: 500 }
      );
    }

    const printOrder = toPrintOrder(typedRow, (items ?? []) as PrintOrderItemRow[]);

    return NextResponse.json({ order: printOrder });
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

/**
 * PATCH /api/admin/print/orders/[id]
 * Confirm a draft order so it enters production.
 * Admin auth required.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const supabase = getSupabase();

    // Fetch order from DB
    const { data: orderRow, error: orderError } = await supabase
      .from('print_orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: 'Failed to fetch order', details: orderError.message },
        { status: 500 }
      );
    }

    if (!orderRow) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const typedRow = orderRow as PrintOrderRow;

    if (!typedRow.gelato_order_id) {
      return NextResponse.json(
        { error: 'Order has no Gelato order ID' },
        { status: 400 }
      );
    }

    if (typedRow.order_type !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft orders can be confirmed' },
        { status: 400 }
      );
    }

    // Confirm draft in Gelato
    const gelato = getGelatoClient();
    const confirmed = await gelato.confirmDraft(typedRow.gelato_order_id);

    // Update DB with new status and order type
    const { data: updated, error: updateError } = await supabase
      .from('print_orders')
      .update({
        status: 'pending',
        order_type: 'order',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to update order in database', details: updateError?.message },
        { status: 500 }
      );
    }

    // Fetch order items for response
    const { data: items, error: itemsError } = await supabase
      .from('print_order_items')
      .select('*')
      .eq('print_order_id', id);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Suppress unused variable warning - confirmed is used to verify API success
    void confirmed;

    const printOrder = toPrintOrder(
      updated as PrintOrderRow,
      (items ?? []) as PrintOrderItemRow[]
    );

    return NextResponse.json({ order: printOrder });
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
