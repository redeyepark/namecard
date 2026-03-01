import { NextRequest, NextResponse } from 'next/server';
import { getUserLinks } from '@/lib/profile-storage';

/**
 * GET /api/profiles/{id}/links
 * Public endpoint to retrieve a user's active links.
 * No authentication required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const links = await getUserLinks(id);

    return NextResponse.json({ links });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
