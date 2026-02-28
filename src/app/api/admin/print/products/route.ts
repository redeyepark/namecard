import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getGelatoClient, GelatoClientError } from '@/lib/gelato';
import { GELATO_PRODUCT_UIDS } from '@/lib/gelato-types';

/**
 * GET /api/admin/print/products?uid=...
 * Get product information from Gelato.
 * Defaults to the STANDARD business card product UID.
 * Admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminToken();

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') ?? GELATO_PRODUCT_UIDS.STANDARD;

    const gelato = getGelatoClient();
    const product = await gelato.getProduct(uid);

    return NextResponse.json({ product });
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
