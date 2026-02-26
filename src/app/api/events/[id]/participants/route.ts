import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getEventParticipants } from '@/lib/event-storage';

/**
 * GET /api/events/[id]/participants - List participants for an event
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const participants = await getEventParticipants(id);

    return NextResponse.json({ participants });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
