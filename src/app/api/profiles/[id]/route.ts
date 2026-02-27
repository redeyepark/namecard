import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/profile-storage';
import { getServerUser } from '@/lib/auth-utils';

export const runtime = 'edge';

/**
 * GET /api/profiles/{userId}
 * Public endpoint to retrieve a user profile with card stats.
 * No authentication required.
 *
 * If the profile is not public and the requester is not the owner,
 * returns 403 Forbidden.
 *
 * Returns ProfilePageData JSON or 404 if profile not found.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profileData = await getProfile(id);

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Privacy check: if profile is not public, only the owner can view it
    if (!profileData.profile.isPublic) {
      const currentUser = await getServerUser();
      if (!currentUser || currentUser.id !== id) {
        return NextResponse.json(
          { error: 'This profile is private' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(profileData);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
