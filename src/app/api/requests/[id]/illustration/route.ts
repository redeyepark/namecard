import { NextRequest, NextResponse } from 'next/server';
import { getImageFile } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buffer = await getImageFile(id, 'illustration');

    if (!buffer) {
      return NextResponse.json(
        { error: 'Illustration not found' },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
