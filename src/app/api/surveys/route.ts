import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerUser, AuthError } from '@/lib/auth-utils';
import {
  getSurveys,
  createSurvey,
  checkSurveyRateLimit,
} from '@/lib/survey-storage';

/**
 * GET /api/surveys
 * Public endpoint for survey list with cursor-based pagination.
 * Query params: cursor, limit (default 20, max 50), sort (latest|popular), tag
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor') || undefined;
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'popular' ? 'popular' : 'latest';
    const tag = searchParams.get('tag') || undefined;

    // Optional auth for user-specific data
    const user = await getServerUser();

    const result = await getSurveys({
      cursor,
      limit,
      sort,
      tag,
      userId: user?.id,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surveys
 * Create a new survey. Requires authentication.
 * Body: {
 *   question: string (10-500 chars),
 *   options: string[] (2-10 items, each 1-200 chars),
 *   selectMode: 'single' | 'multi',
 *   hashtags?: string[] (max 5, each max 20 chars),
 *   closesAt?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limit: 1 survey per 5 minutes
    const rateLimited = await checkSurveyRateLimit(user.id);
    if (rateLimited) {
      return NextResponse.json(
        { error: '설문은 5분에 1개만 작성할 수 있습니다.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { question, options, selectMode, hashtags, closesAt } = body;

    // Validate question
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: '설문 질문을 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 10 || trimmedQuestion.length > 500) {
      return NextResponse.json(
        { error: '설문 질문은 10자 이상 500자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    // Validate options
    if (!Array.isArray(options)) {
      return NextResponse.json(
        { error: '선택지를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (options.length < 2 || options.length > 10) {
      return NextResponse.json(
        { error: '선택지는 2개 이상 10개 이하로 입력해주세요.' },
        { status: 400 }
      );
    }

    for (const option of options) {
      if (typeof option !== 'string' || option.trim().length === 0 || option.trim().length > 200) {
        return NextResponse.json(
          { error: '각 선택지는 1-200자로 입력해주세요.' },
          { status: 400 }
        );
      }
    }

    // Validate selectMode
    if (selectMode !== 'single' && selectMode !== 'multi') {
      return NextResponse.json(
        { error: '선택 모드는 single 또는 multi만 가능합니다.' },
        { status: 400 }
      );
    }

    // Validate hashtags
    if (hashtags !== undefined) {
      if (!Array.isArray(hashtags)) {
        return NextResponse.json(
          { error: '해시태그 형식이 올바르지 않습니다.' },
          { status: 400 }
        );
      }
      if (hashtags.length > 5) {
        return NextResponse.json(
          { error: '해시태그는 최대 5개까지 추가할 수 있습니다.' },
          { status: 400 }
        );
      }
      for (const tag of hashtags) {
        if (typeof tag !== 'string' || tag.trim().length === 0 || tag.trim().length > 20) {
          return NextResponse.json(
            { error: '각 해시태그는 1-20자로 입력해주세요.' },
            { status: 400 }
          );
        }
      }
    }

    const survey = await createSurvey(user.id, {
      question: trimmedQuestion,
      options: options.map((o: string) => o.trim()),
      selectMode,
      hashtags: hashtags || [],
      closesAt: closesAt || null,
    });

    return NextResponse.json(survey, { status: 201 });
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
