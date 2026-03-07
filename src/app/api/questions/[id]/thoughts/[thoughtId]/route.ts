import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { updateThought, deleteThought } from '@/lib/question-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/questions/[id]/thoughts/[thoughtId]
 * Update a thought. Requires authentication + ownership.
 * Body: { content: string (5-1000 chars) }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; thoughtId: string }> }
) {
  try {
    const { id, thoughtId } = await params;

    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(thoughtId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const user = await requireAuth();

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '답변 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 1000) {
      return NextResponse.json(
        { error: '답변은 1자 이상 1000자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    const thought = await updateThought(thoughtId, user.id, trimmedContent);

    if (!thought) {
      return NextResponse.json(
        { error: '답변을 수정할 수 없습니다. 본인의 답변만 수정 가능합니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(thought);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error updating thought:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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
