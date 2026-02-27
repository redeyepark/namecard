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
 * Validate fields for partial update (all fields optional).
 * Returns an error message string or null if valid.
 */
function validateUpdateBody(body: Record<string, unknown>): string | null {
  // slug validation (if provided)
  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string') {
      return 'slug must be a string';
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
  }

  // name validation (if provided)
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || (body.name as string).trim() === '') {
      return 'name must be a non-empty string';
    }
  }

  // baseTemplate validation (if provided)
  if (body.baseTemplate !== undefined && !VALID_BASE_TEMPLATES.includes(body.baseTemplate as string)) {
    return `baseTemplate must be one of: ${VALID_BASE_TEMPLATES.join(', ')}`;
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

  // borderStyle validation (if provided)
  if (body.borderStyle !== undefined && !VALID_BORDER_STYLES.includes(body.borderStyle as string)) {
    return `borderStyle must be one of: ${VALID_BORDER_STYLES.join(', ')}`;
  }

  // borderWidth validation (if provided)
  if (body.borderWidth !== undefined) {
    const bw = body.borderWidth as number;
    if (!Number.isInteger(bw) || bw < 0 || bw > 12) {
      return 'borderWidth must be an integer between 0 and 12';
    }
  }

  // customFields validation (if provided)
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
 * PATCH /api/admin/custom-themes/[id]
 * Partial update of a custom theme.
 * Admin auth required.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const body = await request.json();

    // Validate update fields
    const validationError = validateUpdateBody(body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check that the theme exists
    const { data: existing, error: findError } = await supabase
      .from('custom_themes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: 'Failed to find theme', details: findError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug) {
      const { data: slugCheck, error: slugError } = await supabase
        .from('custom_themes')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .maybeSingle();

      if (slugError) {
        return NextResponse.json(
          { error: 'Failed to check slug uniqueness', details: slugError.message },
          { status: 500 }
        );
      }

      if (slugCheck) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const dbPayload = toDbPayload(body);
    dbPayload.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('custom_themes')
      .update(dbPayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update custom theme', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme: toCustomTheme(updated) });
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
 * DELETE /api/admin/custom-themes/[id]
 * Delete a custom theme.
 * Blocks deletion if theme is in use by card_requests.
 * Admin auth required.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;

    const supabase = getSupabase();

    // Get the theme to find its slug
    const { data: theme, error: findError } = await supabase
      .from('custom_themes')
      .select('id, slug')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: 'Failed to find theme', details: findError.message },
        { status: 500 }
      );
    }

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Check if theme is in use by card_requests
    const { count, error: countError } = await supabase
      .from('card_requests')
      .select('id', { count: 'exact', head: true })
      .eq('theme', theme.slug);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to check theme usage', details: countError.message },
        { status: 500 }
      );
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Theme in use', usageCount: count },
        { status: 409 }
      );
    }

    // Delete the theme
    const { error: deleteError } = await supabase
      .from('custom_themes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete custom theme', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
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
