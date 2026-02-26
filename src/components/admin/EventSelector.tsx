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
      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
