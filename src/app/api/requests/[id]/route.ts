import { NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest, saveImageFile } from '@/lib/storage';
import { isValidStatusTransition } from '@/types/request';
import { auth } from '@/auth';
import type { RequestStatus } from '@/types/request';

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
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...cardRequest,
      originalAvatarUrl: cardRequest.originalAvatarPath
        ? `/api/requests/${id}/avatar`
        : null,
      illustrationUrl: cardRequest.illustrationPath
        ? `/api/requests/${id}/illustration`
        : null,
    });
  } catch {
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

    const { id } = await params;
    const cardRequest = await getRequest(id);

    if (!cardRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, illustrationImage } = body;

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
    }

    // Save illustration image if provided
    let illustrationPath = cardRequest.illustrationPath;
    if (illustrationImage && typeof illustrationImage === 'string') {
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
    const statusHistory = [...cardRequest.statusHistory];
    if (status && status !== cardRequest.status) {
      statusHistory.push({ status: status as RequestStatus, timestamp: now });
    }

    const updated = await updateRequest(id, {
      ...(status ? { status: status as RequestStatus } : {}),
      illustrationPath,
      statusHistory,
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
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
