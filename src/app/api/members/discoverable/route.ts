import { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth-utils';
import { getDiscoverableMembers } from '@/lib/coffee-chat-storage';

/**
 * GET /api/members/discoverable
 * List discoverable members (public endpoint, optional auth).
 * Query params: cursor, limit (default 20, max 50), search
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor') || undefined;
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const search = searchParams.get('search') || undefined;

    const result = await getDiscoverableMembers(
      user?.id ?? null,
      cursor,
      limit,
      search
    );

    return Response.json(result);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
