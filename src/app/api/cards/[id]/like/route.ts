import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/cards/[id]/like
 * Returns like status and count for a card.
 * Authentication is optional - unauthenticated users get liked=false.
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

    // Get like count from card_requests
    const { data: card, error: cardError } = await supabase
      .from('card_requests')
      .select('like_count')
      .eq('id', id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ liked: false, likeCount: 0 });
    }

    // Check if current user has liked (optional auth)
    let liked = false;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: likeRow } = await supabase
        .from('card_likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('card_id', id)
        .maybeSingle();

      liked = !!likeRow;
    }

    return NextResponse.json({
      liked,
      likeCount: card.like_count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards/[id]/like
 * Toggle like on a card. Requires authentication.
 * If already liked, removes the like. Otherwise, adds a like.
 * Updates card_requests.like_count via COUNT subquery.
 * Rate limited to 100 like actions per hour per user.
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

    // Rate limit: max 100 like actions per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentLikes } = await supabase
      .from('card_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (recentLikes !== null && recentLikes > 100) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('card_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('card_id', id)
      .maybeSingle();

    let liked: boolean;

    if (existingLike) {
      // Unlike: remove the like
      await supabase
        .from('card_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', id);
      liked = false;
    } else {
      // Like: insert new like
      await supabase
        .from('card_likes')
        .insert({ user_id: user.id, card_id: id });
      liked = true;
    }

    // Update like_count on card_requests with actual COUNT
    const { count: newCount } = await supabase
      .from('card_likes')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', id);

    const likeCount = newCount ?? 0;

    await supabase
      .from('card_requests')
      .update({ like_count: likeCount })
      .eq('id', id);

    return NextResponse.json({ liked, likeCount });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
