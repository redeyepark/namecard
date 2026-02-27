import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { CustomTheme } from '@/types/custom-theme';

/**
 * Convert a snake_case DB row to a camelCase CustomTheme object.
 */
function toCustomTheme(row: Record<string, unknown>): CustomTheme {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    baseTemplate: row.base_template as 'classic' | 'nametag',
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    frontBgColor: row.front_bg_color as string,
    frontTextColor: row.front_text_color as string,
    frontBorderColor: row.front_border_color as string,
    backBgColor: row.back_bg_color as string,
    backTextColor: row.back_text_color as string,
    backBorderColor: row.back_border_color as string,
    accentColor: row.accent_color as string,
    fontFamily: row.font_family as string,
    borderStyle: row.border_style as 'none' | 'solid' | 'double',
    borderWidth: row.border_width as number,
    customFields: (row.custom_fields ?? []) as CustomTheme['customFields'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const BUILTIN_THEMES = [
  { id: 'classic', label: 'Classic', description: 'Minimal design', color: '#020912' },
  { id: 'pokemon', label: 'Pokemon', description: 'Trading card style', color: '#EED171' },
  { id: 'hearthstone', label: 'Hearthstone', description: 'Legendary card style', color: '#8B6914' },
  { id: 'harrypotter', label: 'Harry Potter', description: 'Wizard card style', color: '#740001' },
  { id: 'tarot', label: 'Tarot', description: 'Mystical card style', color: '#4A0E4E' },
  { id: 'nametag', label: 'Nametag', description: 'Corporate badge style', color: '#374151' },
];

/**
 * GET /api/themes
 * Public API (no auth required).
 * Returns builtin theme metadata + active custom themes.
 */
export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('custom_themes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch custom themes', details: error.message },
        { status: 500 }
      );
    }

    const custom = (rows ?? []).map(toCustomTheme);

    return NextResponse.json({
      builtin: BUILTIN_THEMES,
      custom,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
