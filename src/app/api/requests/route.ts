import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveRequest, saveImageFile, getAllRequests } from '@/lib/storage';
import { auth } from '@/auth';
import type { CardRequest } from '@/types/request';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { card, avatarImage, note } = body;

    // Validate required fields
    if (!card?.front?.displayName || card.front.displayName.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request data', details: 'card.front.displayName is required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Upload avatar image to Supabase Storage if provided
    let originalAvatarPath: string | null = null;
    if (avatarImage && typeof avatarImage === 'string') {
      // Check base64 size (rough estimate: base64 is ~4/3 of original)
      const estimatedSize = (avatarImage.length * 3) / 4;
      if (estimatedSize > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image too large', details: 'Maximum image size is 10MB' },
          { status: 400 }
        );
      }
      originalAvatarPath = await saveImageFile(id, 'avatar', avatarImage);
    }

    // Create request object with avatarImage set to null in card data
    const cardRequest: CardRequest = {
      id,
      card: {
        ...card,
        front: { ...card.front, avatarImage: null },
      },
      originalAvatarPath,
      illustrationPath: null,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      note: note || undefined,
      statusHistory: [{ status: 'submitted', timestamp: now }],
    };

    await saveRequest(cardRequest);

    return NextResponse.json(
      { id, status: 'submitted', submittedAt: now },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Authentication + admin role check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const requests = await getAllRequests();
    return NextResponse.json({ requests, total: requests.length });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
