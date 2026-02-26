import { NextRequest, NextResponse } from 'next/server';
import { getPublicCard } from '@/lib/storage';

/**
 * GET /api/cards/[id]
 * Public endpoint to retrieve a public card by ID.
 * No authentication required.
 * Returns 404 for private cards or non-existent cards (hides existence).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicCard = await getPublicCard(id);

    if (!publicCard) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(publicCard);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
