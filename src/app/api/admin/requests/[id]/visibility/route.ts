import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

/**
 * PATCH /api/admin/requests/[id]/visibility
 * Toggle public/private visibility for any card request (admin only).
 * Admin can change visibility regardless of card status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      );
    }

    const updated = await updateRequest(id, { isPublic });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update visibility' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isPublic: updated.isPublic,
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
