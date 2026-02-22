import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest, saveImageFile } from '@/lib/storage';
import { isEditableStatus } from '@/types/request';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import type { RequestStatus, StatusHistoryEntry } from '@/types/request';

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
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Verify editable status
    if (!isEditableStatus(cardRequest.status)) {
      return NextResponse.json(
        { error: '현재 상태에서는 수정할 수 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { card, note, avatarImage } = body;

    // Upload avatar image if provided
    let originalAvatarPath = cardRequest.originalAvatarPath;
    if (avatarImage && typeof avatarImage === 'string') {
      originalAvatarPath = await saveImageFile(id, 'avatar', avatarImage);
    }

    // Build update object
    const updates: Partial<{
      card: typeof cardRequest.card;
      note: string;
      originalAvatarPath: string | null;
      status: RequestStatus;
      statusHistory: StatusHistoryEntry[];
    }> = {};

    if (card) {
      updates.card = card;
    }
    if (note !== undefined) {
      updates.note = note;
    }
    if (originalAvatarPath !== cardRequest.originalAvatarPath) {
      updates.originalAvatarPath = originalAvatarPath;
    }

    // If current status is revision_requested, automatically resubmit
    if (cardRequest.status === 'revision_requested') {
      const now = new Date().toISOString();
      updates.status = 'submitted';
      updates.statusHistory = [
        ...cardRequest.statusHistory,
        { status: 'submitted' as RequestStatus, timestamp: now },
      ];
    }

    const updated = await updateRequest(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
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
