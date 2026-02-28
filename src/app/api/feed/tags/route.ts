import { NextResponse } from 'next/server';
import { getPopularTags } from '@/lib/storage';

/**
 * GET /api/feed/tags
 * Public endpoint that returns popular hashtags from public cards,
 * sorted by frequency (most common first).
 */
export async function GET() {
  try {
    const tags = await getPopularTags(30);
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
