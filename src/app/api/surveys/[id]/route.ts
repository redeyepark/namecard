import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerUser, AuthError } from '@/lib/auth-utils';
import { getSurveyById, deleteSurvey } from '@/lib/survey-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/surveys/[id]
 * Public endpoint for survey detail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const user = await getServerUser();
    const survey = await getSurveyById(id, user?.id);

    if (!survey) {
      return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(survey);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/surveys/[id]
 * Delete a survey. Requires authentication + ownership.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const user = await requireAuth();
    const deleted = await deleteSurvey(id, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: '설문을 삭제할 수 없습니다. 본인의 설문만 삭제 가능합니다.' },
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
