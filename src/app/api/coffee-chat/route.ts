import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { getSupabase } from '@/lib/supabase';
import {
  getCoffeeChats,
  createCoffeeChat,
  checkCoffeeChatRateLimit,
  checkExistingActiveChat,
} from '@/lib/coffee-chat-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TABS = ['received', 'sent'] as const;
const VALID_STATUSES = ['pending', 'accepted', 'all'] as const;
const VALID_MEETING_PREFERENCES = ['online', 'offline', 'any'] as const;

/**
 * GET /api/coffee-chat
 * List my coffee chats with cursor-based pagination.
 * Query params: tab (received|sent), status (pending|accepted|all), cursor, limit
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = request.nextUrl;

    const tabParam = searchParams.get('tab');
    const tab = VALID_TABS.includes(tabParam as typeof VALID_TABS[number])
      ? (tabParam as typeof VALID_TABS[number])
      : 'received';

    const statusParam = searchParams.get('status');
    const status = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])
      ? (statusParam as typeof VALID_STATUSES[number])
      : 'all';

    const cursor = searchParams.get('cursor') || undefined;
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 50);

    const result = await getCoffeeChats(user.id, tab, status, cursor, limit);

    return Response.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/coffee-chat
 * Create a new coffee chat request.
 * Body: { receiverId, message, meetingPreference }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { receiverId, message, meetingPreference } = body;

    // Validate receiverId
    if (!receiverId || typeof receiverId !== 'string' || !UUID_REGEX.test(receiverId)) {
      return Response.json(
        { error: '유효하지 않은 수신자 ID입니다.' },
        { status: 400 }
      );
    }

    // Validate self-request
    if (receiverId === user.id) {
      return Response.json(
        { error: '자기 자신에게는 커피챗을 요청할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: '메시지를 입력해주세요.' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 20 || trimmedMessage.length > 500) {
      return Response.json(
        { error: '메시지는 20자 이상 500자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    // Validate meetingPreference
    if (
      !meetingPreference ||
      !VALID_MEETING_PREFERENCES.includes(meetingPreference as typeof VALID_MEETING_PREFERENCES[number])
    ) {
      return Response.json(
        { error: '만남 방식을 선택해주세요. (online, offline, any)' },
        { status: 400 }
      );
    }

    // Rate limit check
    const rateLimited = await checkCoffeeChatRateLimit(user.id);
    if (rateLimited) {
      return Response.json(
        { error: '커피챗 요청은 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // Check receiver's profile is public
    const supabase = getSupabase();
    const { data: receiverProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', receiverId)
      .eq('is_public', true)
      .single();

    if (!receiverProfile) {
      return Response.json(
        { error: '상대방의 프로필이 비공개이거나 존재하지 않습니다.' },
        { status: 404 }
      );
    }

    // Check existing active chat
    const existingChat = await checkExistingActiveChat(user.id, receiverId);
    if (existingChat.exists) {
      return Response.json(
        { error: '이미 진행 중인 커피챗 요청이 있습니다.' },
        { status: 409 }
      );
    }

    const chat = await createCoffeeChat(user.id, receiverId, trimmedMessage, meetingPreference);

    return Response.json(chat, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
