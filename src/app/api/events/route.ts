import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { createEvent, getEvents } from '@/lib/event-storage';

/**
 * GET /api/events - List all events with participant counts
 */
export async function GET() {
  try {
    await requireAdminToken();

    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/events - Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();
    const { name, description, eventDate, location } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', details: 'name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Validation error', details: 'name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Validation error', details: 'description must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (location && location.length > 200) {
      return NextResponse.json(
        { error: 'Validation error', details: 'location must be 200 characters or less' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      name: name.trim(),
      description: description?.trim() || undefined,
      eventDate: eventDate || undefined,
      location: location?.trim() || undefined,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
