import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { voteSurvey, getSurveyById } from '@/lib/survey-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/surveys/[id]/vote
 * Vote on a survey. Requires authentication.
 * Body: { optionIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid survey ID' }, { status: 400 });
    }

    const user = await requireAuth();

    const body = await request.json();
    const { optionIds } = body;

    // Validate optionIds
    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { error: '선택지를 선택해주세요.' },
        { status: 400 }
      );
    }

    for (const optionId of optionIds) {
      if (typeof optionId !== 'string' || !UUID_REGEX.test(optionId)) {
        return NextResponse.json(
          { error: '유효하지 않은 선택지 ID입니다.' },
          { status: 400 }
        );
      }
    }

    // Get survey to determine selectMode
    const survey = await getSurveyById(id);
    if (!survey) {
      return NextResponse.json(
        { error: '설문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const result = await voteSurvey(id, user.id, optionIds, survey.selectMode);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Survey not found') {
        return NextResponse.json(
          { error: '설문을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      if (error.message === 'Survey is closed') {
        return NextResponse.json(
          { error: '설문이 마감되었습니다.' },
          { status: 400 }
        );
      }
      if (error.message === 'Single select mode requires exactly 1 option') {
        return NextResponse.json(
          { error: '단일 선택 설문에서는 1개만 선택할 수 있습니다.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
