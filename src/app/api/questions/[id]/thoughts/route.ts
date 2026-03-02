import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerUser, AuthError } from '@/lib/auth-utils';
import {
  getThoughts,
  createThought,
  checkThoughtRateLimit,
} from '@/lib/question-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/questions/[id]/thoughts
 * Public endpoint for thought list with cursor-based pagination.
 * Query params: cursor, limit (default 20, max 50), sort (latest|popular)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor') || undefined;
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'popular' ? 'popular' : 'latest';

    const user = await getServerUser();

    const result = await getThoughts(id, {
      cursor,
      limit,
      sort,
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
 * POST /api/questions/[id]/thoughts
 * Create a new thought. Requires authentication.
 * Body: { content: string (5-1000 chars) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const user = await requireAuth();

    // Rate limit: 1 thought per 30 seconds per question
    const rateLimited = await checkThoughtRateLimit(user.id, id);
    if (rateLimited) {
      return NextResponse.json(
        { error: '같은 질문에 30초에 1개만 답변할 수 있습니다.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '답변 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 5 || trimmedContent.length > 1000) {
      return NextResponse.json(
        { error: '답변은 5자 이상 1000자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    const thought = await createThought(id, user.id, trimmedContent);

    return NextResponse.json(thought, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error creating thought:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
