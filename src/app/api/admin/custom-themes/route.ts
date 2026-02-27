import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import type { CustomTheme, CustomThemeFieldDef } from '@/types/custom-theme';

// Built-in theme IDs that cannot be used as custom theme slugs
const BUILTIN_THEME_IDS = ['classic', 'pokemon', 'hearthstone', 'harrypotter', 'tarot', 'nametag'];

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/;
const VALID_BORDER_STYLES = ['none', 'solid', 'double'];
const VALID_BASE_TEMPLATES = ['classic', 'nametag'];

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

/**
 * Validate a hex color string (#RRGGBB format).
 */
function isValidHexColor(value: unknown): boolean {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value);
}

/**
 * Validate custom fields array structure.
 */
function validateCustomFields(fields: unknown): string | null {
  if (!Array.isArray(fields)) {
    return 'customFields must be an array';
  }
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i] as Partial<CustomThemeFieldDef>;
    if (!field.key || typeof field.key !== 'string') {
      return `customFields[${i}].key is required and must be a string`;
    }
    if (!field.label || typeof field.label !== 'string') {
      return `customFields[${i}].label is required and must be a string`;
    }
    if (!field.type || !['text', 'number'].includes(field.type)) {
      return `customFields[${i}].type must be 'text' or 'number'`;
    }
    if (field.min !== undefined && typeof field.min !== 'number') {
      return `customFields[${i}].min must be a number`;
    }
    if (field.max !== undefined && typeof field.max !== 'number') {
      return `customFields[${i}].max must be a number`;
    }
  }
  return null;
}
/**
 * Validate required fields for theme creation.
 * Returns an error message string or null if valid.
 */
function validateCreateBody(body: Record<string, unknown>): string | null {
  // slug validation
  if (!body.slug || typeof body.slug !== 'string') {
    return 'slug is required';
  }
  const slug = body.slug as string;
  if (slug.length < 2 || slug.length > 50) {
    return 'slug must be 2-50 characters';
  }
  if (!SLUG_REGEX.test(slug)) {
    return 'slug must contain only lowercase letters, numbers, and hyphens';
  }
  if (BUILTIN_THEME_IDS.includes(slug)) {
    return `slug cannot be a built-in theme ID: ${BUILTIN_THEME_IDS.join(', ')}`;
  }

  // name validation
  if (!body.name || typeof body.name !== 'string' || (body.name as string).trim() === '') {
    return 'name is required and must be non-empty';
  }

  // baseTemplate validation
  if (!body.baseTemplate || !VALID_BASE_TEMPLATES.includes(body.baseTemplate as string)) {
    return `baseTemplate is required and must be one of: ${VALID_BASE_TEMPLATES.join(', ')}`;
  }

  // Color field validation
  const colorFields = [
    'frontBgColor', 'frontTextColor', 'frontBorderColor',
    'backBgColor', 'backTextColor', 'backBorderColor',
    'accentColor',
  ];
  for (const field of colorFields) {
    if (body[field] !== undefined && !isValidHexColor(body[field])) {
      return `${field} must be a valid hex color (#RRGGBB format)`;
    }
  }

  // borderStyle validation
  if (body.borderStyle !== undefined && !VALID_BORDER_STYLES.includes(body.borderStyle as string)) {
    return `borderStyle must be one of: ${VALID_BORDER_STYLES.join(', ')}`;
  }

  // borderWidth validation
  if (body.borderWidth !== undefined) {
    const bw = body.borderWidth as number;
    if (!Number.isInteger(bw) || bw < 0 || bw > 12) {
      return 'borderWidth must be an integer between 0 and 12';
    }
  }

  // customFields validation
  if (body.customFields !== undefined) {
    const error = validateCustomFields(body.customFields);
    if (error) return error;
  }

  return null;
}
/**
 * Convert camelCase body fields to snake_case DB columns.
 */
function toDbPayload(body: Record<string, unknown>): Record<string, unknown> {
  const mapping: Record<string, string> = {
    slug: 'slug',
    name: 'name',
    baseTemplate: 'base_template',
    isActive: 'is_active',
    sortOrder: 'sort_order',
    frontBgColor: 'front_bg_color',
    frontTextColor: 'front_text_color',
    frontBorderColor: 'front_border_color',
    backBgColor: 'back_bg_color',
    backTextColor: 'back_text_color',
    backBorderColor: 'back_border_color',
    accentColor: 'accent_color',
    fontFamily: 'font_family',
    borderStyle: 'border_style',
    borderWidth: 'border_width',
    customFields: 'custom_fields',
  };

  const payload: Record<string, unknown> = {};
  for (const [camelKey, snakeKey] of Object.entries(mapping)) {
    if (body[camelKey] !== undefined) {
      payload[snakeKey] = body[camelKey];
    }
  }
  return payload;
}

/**
 * GET /api/admin/custom-themes
 * Returns ALL custom themes (including inactive), ordered by sort_order.
 * Admin auth required.
 */
export async function GET() {
  try {
    await requireAdminToken();

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('custom_themes')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch custom themes', details: error.message },
        { status: 500 }
      );
    }

    const themes = (rows ?? []).map(toCustomTheme);

    return NextResponse.json({ themes });
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
 * POST /api/admin/custom-themes
 * Creates a new custom theme.
 * Admin auth required.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();

    // Validate required fields
    const validationError = validateCreateBody(body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check slug uniqueness in DB
    const { data: existing, error: checkError } = await supabase
      .from('custom_themes')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check slug uniqueness', details: checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'slug already exists' },
        { status: 409 }
      );
    }

    // Build insert payload
    const dbPayload = toDbPayload(body);

    const { data: created, error: insertError } = await supabase
      .from('custom_themes')
      .insert(dbPayload)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create custom theme', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { theme: toCustomTheme(created) },
      { status: 201 }
    );
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
