import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest, saveImageFile } from '@/lib/storage';
import { isValidStatusTransition, requiresFeedback, isAdminEditableStatus } from '@/types/request';
import { requireAuth, requireAdminToken, isAdminTokenValid, AuthError } from '@/lib/auth-utils';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import type { RequestStatus } from '@/types/request';
import type { CardData } from '@/types/card';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Try admin token first
    const isAdminUser = await isAdminTokenValid();

    if (!isAdminUser) {
      // Fall back to regular user auth
      const user = await requireAuth();
      if (cardRequest.createdBy !== user.email) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // originalAvatarPath and illustrationPath now contain Supabase Storage public URLs or external URLs
    // Extract the object and rename fields for the API response
    const {
      originalAvatarPath,
      illustrationPath,
      ...requestWithoutPaths
    } = cardRequest;

    return NextResponse.json({
      ...requestWithoutPaths,
      originalAvatarUrl: originalAvatarPath ?? null,
      illustrationUrl: illustrationPath ?? null,
    });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin role check using cookie-based auth
    await requireAdminToken();

    const { id } = await params;
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, illustrationImage, illustrationUrl, adminFeedback, cardFront, cardBack } = body;

    // Validate status transition
    if (status) {
      if (!isValidStatusTransition(cardRequest.status, status as RequestStatus)) {
        return NextResponse.json(
          {
            error: 'Invalid status transition',
            details: `Cannot transition from ${cardRequest.status} to ${status}`,
          },
          { status: 400 }
        );
      }

      // Validate adminFeedback is required for revision_requested and rejected
      if (requiresFeedback(status as RequestStatus)) {
        if (!adminFeedback || typeof adminFeedback !== 'string' || adminFeedback.trim().length === 0) {
          return NextResponse.json(
            {
              error: 'Admin feedback required',
              details: `Status '${status}' requires a non-empty adminFeedback message.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Determine illustration path: URL takes precedence over base64 image
    let illustrationPath = cardRequest.illustrationPath;
    if (illustrationUrl && typeof illustrationUrl === 'string') {
      // Validate URL format
      if (!illustrationUrl.startsWith('http://') && !illustrationUrl.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Invalid illustration URL', details: 'URL must start with http:// or https://' },
          { status: 400 }
        );
      }
      // Convert Google Drive URL if needed, then use URL directly without uploading to Supabase Storage
      illustrationPath = convertGoogleDriveUrl(illustrationUrl) || illustrationUrl;
    } else if (illustrationImage && typeof illustrationImage === 'string') {
      // Upload base64 image to Supabase Storage
      const estimatedSize = (illustrationImage.length * 3) / 4;
      if (estimatedSize > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image too large', details: 'Maximum image size is 10MB' },
          { status: 400 }
        );
      }
      illustrationPath = await saveImageFile(id, 'illustration', illustrationImage);
    }

    const now = new Date().toISOString();
    const statusChanged = status && status !== cardRequest.status;
    const statusHistory = [...cardRequest.statusHistory];
    if (statusChanged) {
      statusHistory.push({
        status: status as RequestStatus,
        timestamp: now,
        adminFeedback: adminFeedback?.trim() || undefined,
      });
    }

    // Build card data update if provided
    let cardUpdate: { front?: CardData['front']; back?: CardData['back'] } | undefined;
    if (cardFront || cardBack) {
      if (!isAdminEditableStatus(cardRequest.status)) {
        return NextResponse.json(
          { error: 'Cannot edit card data', details: 'Card data cannot be edited in terminal status' },
          { status: 400 }
        );
      }
      cardUpdate = {};
      if (cardFront) {
        cardUpdate.front = { ...cardRequest.card.front, ...cardFront, avatarImage: null };
      }
      if (cardBack) {
        cardUpdate.back = { ...cardRequest.card.back, ...cardBack };
      }
    }

    const updated = await updateRequest(id, {
      ...(status ? { status: status as RequestStatus } : {}),
      illustrationPath,
      ...(statusChanged ? { statusHistory } : {}),
      ...(cardUpdate ? { card: cardUpdate as CardData } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
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
