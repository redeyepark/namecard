import { NextRequest, NextResponse } from 'next/server';
import { getUserCards } from '@/lib/profile-storage';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * GET /api/profiles/{userId}/cards
 * Public endpoint to retrieve a user's public cards with pagination.
 * No authentication required.
 *
 * Query params:
 *   page  - Page number (default: 1)
 *   limit - Items per page (default: 20, max: 50)
 *
 * Returns { cards, total } JSON or 404 if user not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 50);

    // Check if user profile exists
    const supabase = getSupabase();
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await getUserCards(id, page, limit);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
