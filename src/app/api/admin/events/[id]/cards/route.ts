import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import type { CardFrontData, CardBackData, CardTheme } from '@/types/card';

interface EventCardResponse {
  id: string;
  card: {
    front: CardFrontData;
    back: CardBackData;
    theme: CardTheme;
    pokemonMeta?: any;
    hearthstoneMeta?: any;
    harrypotterMeta?: any;
    tarotMeta?: any;
  };
  illustrationUrl: string | null;
}

/**
 * GET /api/admin/events/[id]/cards
 * Fetch full card data for all participants of an event (admin only).
 * Excludes cancelled and rejected cards.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id: eventId } = await params;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('card_requests')
      .select('id, card_front, card_back, illustration_url, theme, pokemon_meta, hearthstone_meta, harrypotter_meta, tarot_meta, status')
      .eq('event_id', eventId)
      .not('status', 'in', '("cancelled","rejected")')
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch event cards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event cards' },
        { status: 500 }
      );
    }

    const cards: EventCardResponse[] = (data ?? []).map((row) => ({
      id: row.id,
      card: {
        front: row.card_front as CardFrontData,
        back: row.card_back as CardBackData,
        theme: (row.theme as CardTheme) ?? 'classic',
        ...(row.pokemon_meta ? { pokemonMeta: row.pokemon_meta } : {}),
        ...(row.hearthstone_meta ? { hearthstoneMeta: row.hearthstone_meta } : {}),
        ...(row.harrypotter_meta ? { harrypotterMeta: row.harrypotter_meta } : {}),
        ...(row.tarot_meta ? { tarotMeta: row.tarot_meta } : {}),
      },
      illustrationUrl: row.illustration_url ?? null,
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error in GET /api/admin/events/[id]/cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
