import { NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/migrate - Check migration status
 * Returns which database migrations have been applied
 */
export async function GET() {
  try {
    await requireAdminToken();

    const supabase = getSupabase();

    // Check if events table exists (Supabase client returns error in response, not throw)
    const { error: eventsErr } = await supabase.from('events').select('id').limit(1);
    const eventsTableExists = !eventsErr;

    const { error: isPublicErr } = await supabase.from('card_requests').select('is_public').limit(1);
    const isPublicColumnExists = !isPublicErr;

    const { error: eventIdErr } = await supabase.from('card_requests').select('event_id').limit(1);
    const eventIdColumnExists = !eventIdErr;

    return NextResponse.json({
      migrations: {
        '005_add_visibility': isPublicColumnExists,
        '006_add_events': eventsTableExists && eventIdColumnExists,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
