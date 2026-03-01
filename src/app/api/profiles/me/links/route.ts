import { NextRequest, NextResponse } from 'next/server';
import { getMyLinks, createUserLink } from '@/lib/profile-storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { validateUrl, sanitizeUrl } from '@/lib/link-validation';

/**
 * GET /api/profiles/me/links
 * Authenticated endpoint to retrieve all of the current user's links (including inactive).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const links = await getMyLinks(user.id);

    return NextResponse.json({ links });
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
 * POST /api/profiles/me/links
 * Authenticated endpoint to create a new link.
 *
 * Body: { title: string, url: string, icon?: string }
 *
 * Validation:
 *   title - 1-100 characters, required
 *   url   - valid http/https URL, required
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { title, url, icon } = body as {
      title?: string;
      url?: string;
      icon?: string;
    };

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 100) {
      return NextResponse.json(
        { error: 'title must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate url
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required' },
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

    const link = await createUserLink(user.id, {
      title: title.trim(),
      url: sanitized,
      icon: icon || undefined,
    });

    return NextResponse.json({ link }, { status: 201 });
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
