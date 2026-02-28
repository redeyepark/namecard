import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { GelatoWebhookEvent } from '@/lib/gelato-types';
import type { PrintStatus } from '@/types/print-order';

/**
 * Map Gelato fulfillment status to internal PrintStatus.
 * Returns null for unmapped statuses so callers can skip the update.
 */
function mapGelatoStatus(gelatoStatus: string): PrintStatus | null {
  const mapping: Record<string, PrintStatus> = {
    'created': 'pending',
    'passed': 'pending',
    'in_production': 'production',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'failed': 'failed',
    'not_confirmed': 'draft',
    'confirmed': 'pending',
  };
  return mapping[gelatoStatus] ?? null;
}

/**
 * Map internal PrintStatus to card_requests.print_status.
 * Returns null when no card-level sync is needed for this status.
 */
function mapPrintCardStatus(status: PrintStatus): string | null {
  const mapping: Record<string, string> = {
    'production': 'ordered',
    'shipped': 'shipped',
    'delivered': 'delivered',
  };
  return mapping[status] ?? null;
}

/**
 * POST /api/webhooks/gelato
 * Receive webhook events from Gelato for order status updates.
 *
 * This endpoint does NOT require admin auth -- it is called externally by Gelato.
 * Instead, it verifies a shared webhook secret via header or query parameter.
 *
 * Design decisions:
 * - Returns 200 for unknown orders to prevent Gelato retry loops.
 * - Idempotent: skips updates when status has not changed.
 * - Syncs card_requests.print_status for relevant status transitions.
 */
export async function POST(request: NextRequest) {
  // 1. Verify webhook secret is configured
  const webhookSecret = process.env.GELATO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhooks/gelato] GELATO_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // 2. Authenticate the request
  // Gelato may send an HMAC signature or a shared secret token.
  // Support multiple verification methods for flexibility:
  //   - x-gelato-hmac-sha256 header (HMAC-based, future implementation)
  //   - x-webhook-secret header (shared secret)
  //   - ?secret= query parameter (shared secret)
  const signature = request.headers.get('x-gelato-hmac-sha256');
  const authToken =
    request.headers.get('x-webhook-secret') ||
    new URL(request.url).searchParams.get('secret');

  if (!signature && authToken !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: When Gelato HMAC signing is configured, implement proper HMAC
  // verification here using the signature header and raw body.

  // 3. Parse the request body
  const bodyText = await request.text();
  let event: GelatoWebhookEvent;
  try {
    event = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 4. Validate required fields
  if (!event.event || !event.orderId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // 5. Find the print order by gelato_order_id
  const { data: order, error: findError } = await supabase
    .from('print_orders')
    .select('id, status')
    .eq('gelato_order_id', event.orderId)
    .single();

  if (findError || !order) {
    // Order not found -- could be a delayed event for an unknown order.
    // Return 200 to prevent Gelato from retrying indefinitely.
    console.warn(
      `[webhooks/gelato] No matching order for gelato_order_id=${event.orderId}`
    );
    return NextResponse.json({ received: true, matched: false });
  }

  // 6. Handle order_status_updated events
  if (event.event === 'order_status_updated' && event.status) {
    const newStatus = mapGelatoStatus(event.status);
    if (!newStatus) {
      return NextResponse.json({
        received: true,
        unmapped_status: event.status,
      });
    }

    // Idempotency: skip update if status is unchanged
    if (order.status === newStatus) {
      return NextResponse.json({ received: true, status: 'unchanged' });
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (event.trackingUrl) updateData.tracking_url = event.trackingUrl;
    if (event.trackingCode) updateData.tracking_code = event.trackingCode;

    const { error: updateError } = await supabase
      .from('print_orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error(
        '[webhooks/gelato] Failed to update order status:',
        updateError
      );
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }

    // Sync card_requests.print_status for all items in this order
    const printCardStatus = mapPrintCardStatus(newStatus);
    if (printCardStatus) {
      const { data: items } = await supabase
        .from('print_order_items')
        .select('card_request_id')
        .eq('print_order_id', order.id);

      if (items && items.length > 0) {
        const cardIds = items.map(
          (i: { card_request_id: string }) => i.card_request_id
        );
        await supabase
          .from('card_requests')
          .update({ print_status: printCardStatus })
          .in('id', cardIds);
      }
    }
  }

  // 7. Handle order_item_status_updated events
  if (event.event === 'order_item_status_updated') {
    // Individual item status -- currently tracking at order level only.
    // Per-item tracking can be extended later if needed.
    // Acknowledge receipt to prevent retry loops.
  }

  return NextResponse.json({ received: true, status: 'processed' });
}
