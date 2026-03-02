import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { respondToCoffeeChat } from '@/lib/coffee-chat-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ACTIONS = ['accept', 'decline', 'cancel', 'complete'] as const;

/**
 * PATCH /api/coffee-chat/[id]/respond
 * Respond to a coffee chat request (accept/decline/cancel/complete).
 * Body: { action, responseMessage? }
 */
export async function PATCH(
  request: NextRequest,
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

    const body = await request.json();
    const { action, responseMessage } = body;

    // Validate action
    if (!action || !VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
      return Response.json(
        { error: '유효하지 않은 액션입니다. (accept, decline, cancel, complete)' },
        { status: 400 }
      );
    }

    // Validate responseMessage if provided
    if (responseMessage !== undefined && responseMessage !== null) {
      if (typeof responseMessage !== 'string') {
        return Response.json(
          { error: '응답 메시지 형식이 올바르지 않습니다.' },
          { status: 400 }
        );
      }
      if (responseMessage.trim().length > 500) {
        return Response.json(
          { error: '응답 메시지는 500자 이하로 작성해주세요.' },
          { status: 400 }
        );
      }
    }

    const chat = await respondToCoffeeChat(
      id,
      user.id,
      action,
      responseMessage?.trim() || undefined
    );

    return Response.json(chat);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
