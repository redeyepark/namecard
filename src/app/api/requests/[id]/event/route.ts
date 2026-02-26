import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getRequest, updateRequest } from '@/lib/storage';

/**
 * PATCH /api/requests/[id]/event - Assign or unassign an event to a request
 * Body: { eventId: string | null }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const body = await request.json();
    const { eventId } = body;

    // Validate eventId is string or null
    if (eventId !== null && typeof eventId !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', details: 'eventId must be a string or null' },
        { status: 400 }
      );
    }

    // Check request exists
    const existing = await getRequest(id);
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updated = await updateRequest(id, { eventId: eventId || undefined });

    // If eventId is null, we need to explicitly set it
    if (eventId === null) {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      await supabase
        .from('card_requests')
        .update({ event_id: null, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, eventId: eventId ?? null, request: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
