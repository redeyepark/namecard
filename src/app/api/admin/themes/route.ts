import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import type { CardTheme, PokemonMeta, PokemonType, HearthstoneMeta, HearthstoneClass } from '@/types/card';

interface ThemeStats {
  theme: string;
  count: number;
}

const VALID_THEMES: CardTheme[] = ['classic', 'pokemon', 'hearthstone'];
const VALID_POKEMON_TYPES: PokemonType[] = [
  'fire', 'water', 'grass', 'electric', 'psychic', 'steel', 'normal',
];
const VALID_HEARTHSTONE_CLASSES: HearthstoneClass[] = [
  'warrior', 'mage', 'rogue', 'priest', 'hunter', 'paladin', 'shaman', 'warlock', 'druid',
];

/**
 * GET /api/admin/themes
 * Returns count of requests per theme.
 */
export async function GET() {
  try {
    await requireAdminToken();

    const supabase = getSupabase();

    // Supabase does not support GROUP BY directly via the JS client,
    // so we fetch all themes and count in JS.
    const { data: rows, error } = await supabase
      .from('card_requests')
      .select('theme');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch theme statistics', details: error.message },
        { status: 500 }
      );
    }

    // Count by theme
    const counts: Record<string, number> = {};
    for (const row of rows || []) {
      const theme = row.theme || 'classic';
      counts[theme] = (counts[theme] || 0) + 1;
    }

    const stats: ThemeStats[] = Object.entries(counts).map(([theme, count]) => ({
      theme,
      count,
    }));

    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/themes
 * Bulk update theme for matching requests.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();
    const { targetTheme, pokemonMeta, hearthstoneMeta, filters } = body as {
      targetTheme?: CardTheme;
      pokemonMeta?: PokemonMeta;
      hearthstoneMeta?: HearthstoneMeta;
      filters?: { status?: string; currentTheme?: string };
    };

    // Validate targetTheme
    if (!targetTheme || !VALID_THEMES.includes(targetTheme)) {
      return NextResponse.json(
        { error: 'Invalid targetTheme', details: `Must be one of: ${VALID_THEMES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate pokemonMeta when target is pokemon
    if (targetTheme === 'pokemon') {
      if (!pokemonMeta || !pokemonMeta.type || !VALID_POKEMON_TYPES.includes(pokemonMeta.type)) {
        return NextResponse.json(
          { error: 'Invalid pokemonMeta', details: 'Pokemon theme requires a valid pokemonMeta with type' },
          { status: 400 }
        );
      }
      if (pokemonMeta.exp === undefined || pokemonMeta.exp < 0 || pokemonMeta.exp > 999) {
        return NextResponse.json(
          { error: 'Invalid pokemonMeta.exp', details: 'EXP must be between 0 and 999' },
          { status: 400 }
        );
      }
    }

    // Validate hearthstoneMeta when target is hearthstone
    if (targetTheme === 'hearthstone') {
      if (!hearthstoneMeta || !hearthstoneMeta.classType || !VALID_HEARTHSTONE_CLASSES.includes(hearthstoneMeta.classType)) {
        return NextResponse.json(
          { error: 'Invalid hearthstoneMeta', details: 'Hearthstone theme requires a valid hearthstoneMeta with classType' },
          { status: 400 }
        );
      }
      if (hearthstoneMeta.mana === undefined || hearthstoneMeta.mana < 0 || hearthstoneMeta.mana > 10) {
        return NextResponse.json(
          { error: 'Invalid hearthstoneMeta.mana', details: 'Mana must be between 0 and 10' },
          { status: 400 }
        );
      }
      if (hearthstoneMeta.attack === undefined || hearthstoneMeta.attack < 0 || hearthstoneMeta.attack > 12) {
        return NextResponse.json(
          { error: 'Invalid hearthstoneMeta.attack', details: 'Attack must be between 0 and 12' },
          { status: 400 }
        );
      }
      if (hearthstoneMeta.health === undefined || hearthstoneMeta.health < 1 || hearthstoneMeta.health > 12) {
        return NextResponse.json(
          { error: 'Invalid hearthstoneMeta.health', details: 'Health must be between 1 and 12' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabase();

    // Build query with filters
    let query = supabase.from('card_requests').select('id', { count: 'exact' });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.currentTheme && filters.currentTheme !== 'all') {
      query = query.eq('theme', filters.currentTheme);
    }

    const { count, error: countError } = await query;

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to count matching requests', details: countError.message },
        { status: 500 }
      );
    }

    if (!count || count === 0) {
      return NextResponse.json({ updatedCount: 0 });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      theme: targetTheme,
      updated_at: new Date().toISOString(),
    };

    if (targetTheme === 'pokemon' && pokemonMeta) {
      updatePayload.pokemon_meta = pokemonMeta;
      updatePayload.hearthstone_meta = null;
    } else if (targetTheme === 'hearthstone' && hearthstoneMeta) {
      updatePayload.hearthstone_meta = hearthstoneMeta;
      updatePayload.pokemon_meta = null;
    } else if (targetTheme === 'classic') {
      updatePayload.pokemon_meta = null;
      updatePayload.hearthstone_meta = null;
    }

    // Execute update with same filters
    let updateQuery = supabase.from('card_requests').update(updatePayload);

    if (filters?.status && filters.status !== 'all') {
      updateQuery = updateQuery.eq('status', filters.status);
    }
    if (filters?.currentTheme && filters.currentTheme !== 'all') {
      updateQuery = updateQuery.eq('theme', filters.currentTheme);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update themes', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ updatedCount: count });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
