import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

/**
 * POST /api/admin/bulk-publish
 *
 * Sets is_public = true for all card_requests where:
 * - illustration_url IS NOT NULL and not empty
 * - status IN ('confirmed', 'delivered')
 *
 * Requires admin authentication via admin-token cookie.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const supabase = getSupabase();
    const validStatuses = ['confirmed', 'delivered'];

    // Count how many cards will be affected
    const { count, error: countError } = await supabase
      .from('card_requests')
      .select('*', { count: 'exact', head: true })
      .not('illustration_url', 'is', null)
      .neq('illustration_url', '')
      .in('status', validStatuses)
      .eq('is_public', false);

    if (countError) {
      console.error('[bulk-publish] Count query failed:', countError);
      return NextResponse.json(
        { error: 'Failed to count target cards', details: countError.message },
        { status: 500 }
      );
    }

    const targetCount = count ?? 0;

    if (targetCount === 0) {
      return NextResponse.json({
        updated: 0,
        message: 'No cards to update. All eligible cards are already public.',
      });
    }

    // Execute the bulk update
    const { data, error: updateError } = await supabase
      .from('card_requests')
      .update({ is_public: true })
      .not('illustration_url', 'is', null)
      .neq('illustration_url', '')
      .in('status', validStatuses)
      .select('id');

    if (updateError) {
      console.error('[bulk-publish] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cards', details: updateError.message },
        { status: 500 }
      );
    }

    const updatedCount = data?.length ?? 0;

    return NextResponse.json({
      updated: updatedCount,
      message: `Successfully published ${updatedCount} card(s).`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[bulk-publish] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
