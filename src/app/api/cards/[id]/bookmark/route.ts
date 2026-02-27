import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'edge';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/cards/[id]/bookmark
 * Returns bookmark status for a card. Requires authentication.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if bookmarked
    const { data: bookmark } = await supabase
      .from('card_bookmarks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('card_id', id)
      .maybeSingle();

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards/[id]/bookmark
 * Toggle bookmark on a card. Requires authentication.
 * If already bookmarked, removes it. Otherwise, adds a bookmark.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check card exists
    const { data: card, error: cardError } = await supabase
      .from('card_requests')
      .select('id')
      .eq('id', id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('card_bookmarks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('card_id', id)
      .maybeSingle();

    let bookmarked: boolean;

    if (existingBookmark) {
      // Remove bookmark
      await supabase
        .from('card_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', id);
      bookmarked = false;
    } else {
      // Add bookmark
      await supabase
        .from('card_bookmarks')
        .insert({ user_id: user.id, card_id: id });
      bookmarked = true;
    }

    return NextResponse.json({ bookmarked });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
