import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerUser, AuthError } from '@/lib/auth-utils';
import {
  getQuestions,
  createQuestion,
  checkQuestionRateLimit,
} from '@/lib/question-storage';

/**
 * GET /api/questions
 * Public endpoint for question list with cursor-based pagination.
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

    // Optional auth for isOwner flag
    const user = await getServerUser();

    const result = await getQuestions({
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
 * POST /api/questions
 * Create a new question. Requires authentication.
 * Body: { content: string (10-500 chars), hashtags?: string[] (max 5, each max 20 chars) }
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();

    // Rate limit: 1 question per 60 seconds
    const rateLimited = await checkQuestionRateLimit(user.id);
    if (rateLimited) {
      return NextResponse.json(
        { error: '질문은 1분에 1개만 작성할 수 있습니다.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, hashtags } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '질문 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 10 || trimmedContent.length > 500) {
      return NextResponse.json(
        { error: '질문은 10자 이상 500자 이하로 작성해주세요.' },
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

    const question = await createQuestion(
      user.id,
      trimmedContent,
      hashtags || []
    );

    if (!question) {
      return NextResponse.json(
        { error: '질문 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error creating question:', {
      userId: user?.id,
      error: errorMessage,
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
