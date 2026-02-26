import { NextRequest, NextResponse } from 'next/server';
import { getPublicCards, getGalleryCards } from '@/lib/storage';

/**
 * GET /api/cards
 * Public endpoint to retrieve cards. No authentication required.
 *
 * Query params:
 *   view  - 'gallery' for event-grouped view (all non-cancelled/rejected cards)
 *   page  - Page number (default: 1, ignored when view=gallery)
 *   limit - Items per page (default: 12, max: 50, ignored when view=gallery)
 *   theme - Optional theme filter (ignored when view=gallery)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const view = searchParams.get('view');

    // Gallery view: return all cards grouped by event
    if (view === 'gallery') {
      const result = await getGalleryCards();
      return NextResponse.json(result);
    }

    // Default view: paginated public cards (backward compatible)
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
