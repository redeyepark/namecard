import { requireAuth, AuthError } from '@/lib/auth-utils';
import { getPendingReceivedCount } from '@/lib/coffee-chat-storage';

/**
 * GET /api/coffee-chat/pending-count
 * Get pending received coffee chat count (for badge display).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const count = await getPendingReceivedCount(user.id);

    return Response.json({ count });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
