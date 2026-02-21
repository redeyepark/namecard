import { NextRequest, NextResponse } from 'next/server';
import { getImageFile } from '@/lib/storage';
import { auth } from '@/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
