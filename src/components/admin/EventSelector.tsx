'use client';

import { useState, useEffect } from 'react';
import type { EventWithCount } from '@/types/event';

interface EventSelectorProps {
  value: string | null;
  onChange: (eventId: string | null) => void;
  disabled?: boolean;
}

/**
 * Dropdown selector for choosing an event.
 * Shows "미할당" option plus all available events.
 */
export function EventSelector({ value, onChange, disabled }: EventSelectorProps) {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch {
        // Silently fail - selector will show empty
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled || loading}
      className="block w-full px-3 py-2 text-sm border border-border-medium rounded-lg bg-surface text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">미할당</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
          {event.eventDate ? ` (${event.eventDate})` : ''}
        </option>
      ))}
    </select>
  );
}
