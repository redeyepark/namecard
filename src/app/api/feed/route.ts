import { NextRequest, NextResponse } from 'next/server';
import { getFeedCards } from '@/lib/storage';

export const runtime = 'edge';

/**
 * GET /api/feed
 * Public endpoint for the community feed with cursor-based pagination.
 * No authentication required.
 *
 * Query params:
 *   cursor - Cursor string for pagination (ISO timestamp or "{likeCount}_{id}")
 *   limit  - Items per page (default: 12, max: 50, min: 1)
 *   theme  - Theme filter (default: 'all')
 *   sort   - Sort order: 'newest' | 'popular' (default: 'newest')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor') || undefined;
    const rawLimit = parseInt(searchParams.get('limit') || '12', 10) || 12;
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const theme = searchParams.get('theme') || 'all';
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'popular' ? 'popular' : 'newest';

    const result = await getFeedCards({ cursor, limit, theme, sort });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
