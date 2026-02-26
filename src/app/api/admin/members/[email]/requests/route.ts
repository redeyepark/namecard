import { NextRequest, NextResponse } from 'next/server';
import { getMemberRequests } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

/**
 * GET /api/admin/members/[email]/requests
 * List all card requests for a specific member (admin only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await requireAdminToken();

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const requests = await getMemberRequests(decodedEmail);

    return NextResponse.json({ requests });
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
