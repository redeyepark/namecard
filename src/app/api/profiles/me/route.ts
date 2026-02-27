import { NextRequest, NextResponse } from 'next/server';
import { updateProfile, ensureProfile } from '@/lib/profile-storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';

export const runtime = 'edge';

/**
 * GET /api/profiles/me
 * Authenticated endpoint to retrieve the current user's profile.
 * Creates a profile if one doesn't exist yet (via ensureProfile).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await ensureProfile(user.id, user.email || '');

    return NextResponse.json({ profile });
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

/**
 * PUT /api/profiles/me
 * Authenticated endpoint to update the current user's profile.
 *
 * Body: { displayName?, bio?, avatarUrl?, isPublic? }
 *
 * Validation:
 *   displayName - 1-100 characters
 *   bio         - max 200 characters
 *
 * Returns 401 if not authenticated.
 * Returns 400 if validation fails.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { displayName, bio, avatarUrl, isPublic } = body as {
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      isPublic?: boolean;
    };

    // Validate inputs before passing to storage layer
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length < 1 || displayName.length > 100) {
        return NextResponse.json(
          { error: 'displayName must be between 1 and 100 characters' },
          { status: 400 }
        );
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 200) {
        return NextResponse.json(
          { error: 'bio must be at most 200 characters' },
          { status: 400 }
        );
      }
    }

    // Ensure profile exists before updating
    await ensureProfile(user.id, user.email || '');

    const updatedProfile = await updateProfile(user.id, {
      displayName,
      bio,
      avatarUrl,
      isPublic,
    });

    return NextResponse.json({ profile: updatedProfile });
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
