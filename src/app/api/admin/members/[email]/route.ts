import { NextRequest, NextResponse } from 'next/server';
import { deleteRequestsByUser } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

/**
 * DELETE /api/admin/members/[email]
 * Delete all card requests for a member and optionally the auth user (admin only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await requireAdminToken();

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const deletedCount = await deleteRequestsByUser(decodedEmail);

    return NextResponse.json({
      message: `Deleted ${deletedCount} request(s) for ${decodedEmail}`,
      deletedCount,
    });
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
