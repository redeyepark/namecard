import { NextResponse } from 'next/server';
import { getAllMembers } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

/**
 * GET /api/admin/members
 * List all unique members with request counts (admin only).
 */
export async function GET() {
  try {
    await requireAdminToken();

    const members = await getAllMembers();

    return NextResponse.json({ members });
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
