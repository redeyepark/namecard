import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, getServerUser, AuthError } from '@/lib/auth-utils';
import { getAdminQuestions, adminCreateQuestion } from '@/lib/question-storage';

/**
 * GET /api/admin/questions
 * List questions with pagination, search, and filter (admin only).
 * Query params: page (default 0), limit (default 20), search, includeInactive (default true)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminToken();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const result = await getAdminQuestions({
      page: isNaN(page) ? 0 : page,
      limit: isNaN(limit) ? 20 : Math.min(limit, 100),
      search,
      includeInactive,
    });

    return NextResponse.json(result);
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

/**
 * POST /api/admin/questions
 * Create a new question (admin only, no rate limit).
 * Body: { content: string, hashtags?: string[], authorId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();
    const { content, hashtags, authorId } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length < 10) {
      return NextResponse.json(
        { error: 'content must be at least 10 characters' },
        { status: 400 }
      );
    }
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: 'content must not exceed 500 characters' },
        { status: 400 }
      );
    }

    // Validate hashtags if provided
    if (hashtags !== undefined) {
      if (!Array.isArray(hashtags)) {
        return NextResponse.json(
          { error: 'hashtags must be an array' },
          { status: 400 }
        );
      }
      if (hashtags.length > 5) {
        return NextResponse.json(
          { error: 'Maximum 5 hashtags allowed' },
          { status: 400 }
        );
      }
      for (const tag of hashtags) {
        if (typeof tag !== 'string' || tag.trim().length === 0 || tag.trim().length > 20) {
          return NextResponse.json(
            { error: 'Each hashtag must be a string of 1-20 characters' },
            { status: 400 }
          );
        }
      }
    }

    // Determine author: use provided authorId, or fall back to logged-in user
    let effectiveAuthorId = authorId;
    if (!effectiveAuthorId) {
      const user = await getServerUser();
      if (!user) {
        return NextResponse.json(
          { error: '질문을 생성하려면 Supabase 계정으로 로그인해야 합니다.' },
          { status: 400 }
        );
      }
      effectiveAuthorId = user.id;
    }

    const question = await adminCreateQuestion(
      trimmed,
      hashtags || [],
      effectiveAuthorId
    );

    return NextResponse.json({ question }, { status: 201 });
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
