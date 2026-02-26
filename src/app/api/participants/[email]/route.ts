import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getParticipantHistory } from '@/lib/event-storage';

/**
 * GET /api/participants/[email] - Get participant's event history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await requireAdminToken();

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const history = await getParticipantHistory(decodedEmail);

    return NextResponse.json({ history });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
