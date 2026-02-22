import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveRequest, saveImageFile, getAllRequests } from '@/lib/storage';
import { requireAuth, requireAdminToken, AuthError } from '@/lib/auth-utils';
import type { CardRequest } from '@/types/request';

export async function POST(request: NextRequest) {
  try {
    // Authentication check using Supabase Auth
    const user = await requireAuth();

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
      createdBy: user.email ?? undefined,
      statusHistory: [{ status: 'submitted', timestamp: now }],
    };

    await saveRequest(cardRequest);

    return NextResponse.json(
      { id, status: 'submitted', submittedAt: now },
      { status: 201 }
    );
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

export async function GET() {
  try {
    // Admin role check using cookie-based auth
    await requireAdminToken();

    const requests = await getAllRequests();
    return NextResponse.json({ requests, total: requests.length });
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
