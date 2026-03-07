import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { submitMbtiAnswer, getMbtiProgress } from '@/lib/mbti-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/mbti/answer
 * Submit an MBTI answer. Requires authentication.
 * Body: { questionId: string, answer: 'A' | 'B' }
 * Returns updated progress after submission.
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();

    const body = await request.json();
    const { questionId, answer } = body;

    // Validate questionId
    if (!questionId || typeof questionId !== 'string' || !UUID_REGEX.test(questionId)) {
      return NextResponse.json(
        { error: '유효하지 않은 질문 ID입니다.' },
        { status: 400 }
      );
    }

    // Validate answer
    if (!answer || (answer !== 'A' && answer !== 'B')) {
      return NextResponse.json(
        { error: '답변은 A 또는 B만 가능합니다.' },
        { status: 400 }
      );
    }

    // Submit the answer
    const result = await submitMbtiAnswer(user.id, questionId, answer);

    // Return updated progress
    const progress = await getMbtiProgress(user.id);

    return NextResponse.json({
      ...progress,
      newLevel: result.newLevel,
      mbtiType: result.mbtiType,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error submitting MBTI answer:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
