import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { CardTheme, GalleryCardData } from '@/types/card';

/**
 * GET /api/bookmarks
 * Returns bookmarked cards for the authenticated user with pagination.
 * Requires authentication.
 *
 * Query params:
 *   page     - Page number (default: 1)
 *   pageSize - Items per page (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '20', 10) || 20;
    const pageSize = Math.min(Math.max(1, rawPageSize), 50);
    const offset = (page - 1) * pageSize;

    // Count total bookmarks for this user
    const { count: total } = await supabase
      .from('card_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch bookmarked card IDs with pagination, ordered by bookmark date
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('card_bookmarks')
      .select('card_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (bookmarkError || !bookmarks || bookmarks.length === 0) {
      return NextResponse.json({
        cards: [],
        total: total ?? 0,
        page,
        pageSize,
      });
    }

    // Fetch card details for the bookmarked cards
    const cardIds = bookmarks.map((b) => b.card_id);
    const { data: rows, error: cardError } = await supabase
      .from('card_requests')
      .select('id, card_front, card_back, theme, illustration_url, original_avatar_url, status, like_count')
      .in('id', cardIds);

    if (cardError || !rows) {
      return NextResponse.json({
        cards: [],
        total: total ?? 0,
        page,
        pageSize,
      });
    }

    // Create a map for ordering by bookmark date
    const orderMap = new Map(bookmarks.map((b, i) => [b.card_id, i]));

    // Map and sort by bookmark order
    const cards: GalleryCardData[] = rows
      .map((row) => ({
        id: row.id,
        displayName: (row.card_front as { displayName?: string })?.displayName || '',
        title: (row.card_back as { title?: string })?.title || '',
        theme: (row.theme as CardTheme) || 'classic',
        illustrationUrl: row.illustration_url ?? null,
        originalAvatarUrl: row.original_avatar_url ?? null,
        status: row.status,
        likeCount: row.like_count ?? 0,
      }))
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    return NextResponse.json({
      cards,
      total: total ?? 0,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
