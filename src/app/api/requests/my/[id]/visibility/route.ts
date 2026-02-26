import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest } from '@/lib/storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';

/**
 * PATCH /api/requests/my/[id]/visibility
 * Toggle public/private visibility for a user's own card request.
 * Only confirmed/delivered cards can be made public.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (cardRequest.createdBy !== user.email) {
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

    // Only confirmed/delivered cards can be made public
    if (isPublic && cardRequest.status !== 'confirmed' && cardRequest.status !== 'delivered') {
      return NextResponse.json(
        { error: '확정 또는 배송 완료된 명함만 공개할 수 있습니다.' },
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

    const shareUrl = updated.isPublic
      ? `${new URL(request.url).origin}/cards/${id}`
      : null;

    return NextResponse.json({
      isPublic: updated.isPublic,
      shareUrl,
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
