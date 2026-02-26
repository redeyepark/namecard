import { getSupabase } from './supabase';
import type { EventWithCount, EventParticipant, ParticipantEventHistory } from '@/types/event';
import type { CardTheme } from '@/types/card';

/**
 * Create a new event.
 */
export async function createEvent(event: {
  name: string;
  description?: string;
  eventDate?: string;
  location?: string;
}): Promise<EventWithCount> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name,
      description: event.description || null,
      event_date: event.eventDate || null,
      location: event.location || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create event: ${error?.message ?? 'Unknown error'}`);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    eventDate: data.event_date || undefined,
    location: data.location || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    participantCount: 0,
  };
}

/**
 * Get all events with participant counts, ordered by created_at descending.
 */
export async function getEvents(): Promise<EventWithCount[]> {
  const supabase = getSupabase();

  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (eventsError || !events) {
    return [];
  }

  // Fetch participant counts per event
  const { data: counts, error: countsError } = await supabase
    .from('card_requests')
    .select('event_id')
    .not('event_id', 'is', null);

  if (countsError || !counts) {
    // Return events with 0 counts if count query fails
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description || undefined,
      eventDate: e.event_date || undefined,
      location: e.location || undefined,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      participantCount: 0,
    }));
  }

  // Build count map
  const countMap = new Map<string, number>();
  for (const row of counts) {
    const eid = row.event_id as string;
    countMap.set(eid, (countMap.get(eid) || 0) + 1);
  }

  return events.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description || undefined,
    eventDate: e.event_date || undefined,
    location: e.location || undefined,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    participantCount: countMap.get(e.id) || 0,
  }));
}

/**
 * Get a single event by ID with participant count.
 */
export async function getEventById(id: string): Promise<EventWithCount | null> {
  const supabase = getSupabase();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    return null;
  }

  // Get participant count
  const { count } = await supabase
    .from('card_requests')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id);

  return {
    id: event.id,
    name: event.name,
    description: event.description || undefined,
    eventDate: event.event_date || undefined,
    location: event.location || undefined,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    participantCount: count ?? 0,
  };
}

/**
 * Update an event's metadata.
 */
export async function updateEvent(
  id: string,
  updates: {
    name?: string;
    description?: string;
    eventDate?: string;
    location?: string;
  }
): Promise<EventWithCount | null> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate || null;
  if (updates.location !== undefined) dbUpdates.location = updates.location || null;

  const { error } = await supabase
    .from('events')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  return getEventById(id);
}

/**
 * Delete an event. Throws error if participants are linked.
 */
export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabase();

  // Check for linked participants
  const { count } = await supabase
    .from('card_requests')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id);

  if (count && count > 0) {
    throw new Error(`Cannot delete event: ${count} participants are linked to this event`);
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

/**
 * Get participants for a specific event.
 */
export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, created_by, status, submitted_at, theme')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  return rows.map((row) => ({
    requestId: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    email: row.created_by || undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    theme: (row.theme as CardTheme) || undefined,
  }));
}

/**
 * Get event participation history for a specific user (by email).
 */
export async function getParticipantHistory(email: string): Promise<ParticipantEventHistory[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, event_id, status, submitted_at')
    .eq('created_by', email)
    .not('event_id', 'is', null)
    .order('submitted_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  // Fetch event details for all event IDs
  const eventIds = [...new Set(rows.map((r) => r.event_id as string))];
  if (eventIds.length === 0) return [];

  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date')
    .in('id', eventIds);

  const eventMap = new Map<string, { name: string; eventDate?: string }>();
  if (events) {
    for (const e of events) {
      eventMap.set(e.id, { name: e.name, eventDate: e.event_date || undefined });
    }
  }

  return rows
    .filter((r) => eventMap.has(r.event_id as string))
    .map((r) => {
      const event = eventMap.get(r.event_id as string)!;
      return {
        eventId: r.event_id as string,
        eventName: event.name,
        eventDate: event.eventDate,
        requestId: r.id,
        status: r.status,
        submittedAt: r.submitted_at,
      };
    });
}
