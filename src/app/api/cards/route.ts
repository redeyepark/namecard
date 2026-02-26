import { NextRequest, NextResponse } from 'next/server';
import { getPublicCards } from '@/lib/storage';

/**
 * GET /api/cards
 * Public endpoint to retrieve paginated list of public cards.
 * No authentication required.
 *
 * Query params:
 *   page  - Page number (default: 1)
 *   limit - Items per page (default: 12, max: 50)
 *   theme - Optional theme filter (classic, pokemon, hearthstone, harrypotter, tarot)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const rawLimit = parseInt(searchParams.get('limit') || '12', 10) || 12;
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const theme = searchParams.get('theme') || undefined;

    const { cards, total } = await getPublicCards(page, limit, theme);

    return NextResponse.json({
      cards,
      total,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
