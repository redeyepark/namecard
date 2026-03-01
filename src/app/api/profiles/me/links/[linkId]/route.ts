import { NextRequest, NextResponse } from 'next/server';
import { updateUserLink, deleteUserLink } from '@/lib/profile-storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { validateUrl, sanitizeUrl } from '@/lib/link-validation';

/**
 * PUT /api/profiles/me/links/{linkId}
 * Authenticated endpoint to update an existing link.
 * Ownership is verified (user can only update their own links).
 *
 * Body: { title?: string, url?: string, icon?: string, isActive?: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await requireAuth();
    const { linkId } = await params;

    const body = await request.json();
    const { title, url, icon, isActive } = body as {
      title?: string;
      url?: string;
      icon?: string;
      isActive?: boolean;
    };

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 100) {
        return NextResponse.json(
          { error: 'title must be between 1 and 100 characters' },
          { status: 400 }
        );
      }
    }

    // Validate url if provided
    if (url !== undefined) {
      if (typeof url !== 'string') {
        return NextResponse.json(
          { error: 'url must be a string' },
          { status: 400 }
        );
      }

      const sanitized = sanitizeUrl(url);
      const validation = validateUrl(sanitized);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    const updateData: { title?: string; url?: string; icon?: string; isActive?: boolean } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (url !== undefined) {
      updateData.url = sanitizeUrl(url);
    }
    if (icon !== undefined) {
      updateData.icon = icon;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const link = await updateUserLink(user.id, linkId, updateData);

    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Handle ownership/not-found errors from storage layer
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Link not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/me/links/{linkId}
 * Authenticated endpoint to delete an existing link.
 * Ownership is verified (user can only delete their own links).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await requireAuth();
    const { linkId } = await params;

    await deleteUserLink(user.id, linkId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Handle ownership/not-found errors from storage layer
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Link not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
