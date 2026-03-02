import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { getCoffeeChatById } from '@/lib/coffee-chat-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/coffee-chat/[id]
 * Get coffee chat detail. Requires authentication.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return Response.json(
        { error: '유효하지 않은 커피챗 ID입니다.' },
        { status: 400 }
      );
    }

    const chat = await getCoffeeChatById(id, user.id);

    if (!chat) {
      return Response.json(
        { error: '커피챗을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return Response.json(chat);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
