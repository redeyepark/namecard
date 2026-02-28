import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getGelatoClient, GelatoClientError } from '@/lib/gelato';
import type { GelatoQuoteRequest } from '@/lib/gelato-types';

/**
 * POST /api/admin/print/quote
 * Request a shipping/pricing quote from Gelato.
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

    const quoteRequest: GelatoQuoteRequest = {
      orderReferenceId: `quote-${Date.now()}`,
      customerReferenceId: 'admin',
      currency: body.currency,
      items: body.items,
      shippingAddress: body.shippingAddress,
      ...(body.shipmentMethodUid && { shipmentMethodUid: body.shipmentMethodUid }),
    };

    const gelato = getGelatoClient();
    const quote = await gelato.createQuote(quoteRequest);

    return NextResponse.json({ quote });
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
