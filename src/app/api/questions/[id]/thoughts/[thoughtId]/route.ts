import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { deleteThought } from '@/lib/question-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DELETE /api/questions/[id]/thoughts/[thoughtId]
 * Delete a thought. Requires authentication + ownership.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; thoughtId: string }> }
) {
  try {
    const { id, thoughtId } = await params;

    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(thoughtId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const user = await requireAuth();
    const deleted = await deleteThought(thoughtId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: '답변을 삭제할 수 없습니다. 본인의 답변만 삭제 가능합니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
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
