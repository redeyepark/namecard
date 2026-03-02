import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { toggleThoughtLike, checkLikeRateLimit } from '@/lib/question-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/thoughts/[id]/like
 * Toggle like on a thought. Requires authentication.
 * Returns { liked: boolean, likeCount: number }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid thought ID' }, { status: 400 });
    }

    const user = await requireAuth();

    // Rate limit: max 100 like actions per hour
    const rateLimited = await checkLikeRateLimit(user.id);
    if (rateLimited) {
      return NextResponse.json(
        { error: '좋아요는 시간당 100회까지 가능합니다.' },
        { status: 429 }
      );
    }

    const result = await toggleThoughtLike(id, user.id);

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
