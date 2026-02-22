import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest } from '@/lib/storage';
import { isCancellableStatus } from '@/types/request';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import type { RequestStatus } from '@/types/request';

export async function POST(
  _request: NextRequest,
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
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Verify cancellable status
    if (!isCancellableStatus(cardRequest.status)) {
      return NextResponse.json(
        { error: '현재 상태에서는 취소할 수 없습니다.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const statusHistory = [
      ...cardRequest.statusHistory,
      { status: 'cancelled' as RequestStatus, timestamp: now },
    ];

    const updated = await updateRequest(id, {
      status: 'cancelled',
      statusHistory,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to cancel request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      status: 'cancelled',
      updatedAt: updated.updatedAt,
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
