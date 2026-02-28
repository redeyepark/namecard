import { NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getGelatoClient, GelatoClientError } from '@/lib/gelato';

/**
 * GET /api/admin/print/shipping-methods
 * List all available shipment methods from Gelato.
 * Admin auth required.
 */
export async function GET() {
  try {
    await requireAdminToken();

    const gelato = getGelatoClient();
    const shipmentMethods = await gelato.getShipmentMethods();

    return NextResponse.json({ shipmentMethods });
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
