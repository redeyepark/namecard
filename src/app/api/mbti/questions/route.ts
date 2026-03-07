import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-utils';
import { getMbtiQuestions, getMbtiProgress } from '@/lib/mbti-storage';

/**
 * GET /api/mbti/questions
 * Returns MBTI progress if authenticated, just questions if not.
 * Unauthenticated users see all questions but no answers/unlock status.
 */
export async function GET() {
  try {
    const user = await getServerUser();

    if (user) {
      // Authenticated: return full progress with answers and unlock status
      const progress = await getMbtiProgress(user.id);
      return NextResponse.json(progress);
    }

    // Unauthenticated: return questions only (all unlocked=false, no answers)
    const questions = await getMbtiQuestions();
    const questionsWithStatus = questions.map((q) => ({
      ...q,
      isUnlocked: false,
      userAnswer: null,
    }));

    return NextResponse.json({
      questions: questionsWithStatus,
      answeredCount: 0,
      totalCount: questions.length,
      level: 1,
      mbtiType: null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
