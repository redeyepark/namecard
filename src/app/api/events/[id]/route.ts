import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getEventById, updateEvent, deleteEvent } from '@/lib/event-storage';

/**
 * GET /api/events/[id] - Get event detail with participant count
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/events/[id] - Update event metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;
    const body = await request.json();
    const { name, description, eventDate, location } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Validation error', details: 'name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (name && name.length > 100) {
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

    const event = await updateEvent(id, {
      name: name?.trim(),
      description: description?.trim(),
      eventDate,
      location: location?.trim(),
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id] - Delete event (409 if participants exist)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminToken();

    const { id } = await params;

    // Check existence first
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.message.includes('Cannot delete event')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
