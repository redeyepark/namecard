import { NextRequest, NextResponse } from 'next/server';
import { reorderUserLinks } from '@/lib/profile-storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';

/**
 * PATCH /api/profiles/me/links/reorder
 * Authenticated endpoint to reorder the current user's links.
 *
 * Body: { linkIds: string[] }
 *
 * The linkIds array determines the new order: index 0 = sort_order 0, etc.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { linkIds } = body as { linkIds?: string[] };

    // Validate linkIds
    if (!linkIds || !Array.isArray(linkIds)) {
      return NextResponse.json(
        { error: 'linkIds must be an array of strings' },
        { status: 400 }
      );
    }

    if (linkIds.length === 0) {
      return NextResponse.json(
        { error: 'linkIds must not be empty' },
        { status: 400 }
      );
    }

    // Ensure all items are strings
    if (!linkIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'linkIds must contain only strings' },
        { status: 400 }
      );
    }

    await reorderUserLinks(user.id, linkIds);

    return NextResponse.json({ success: true });
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
