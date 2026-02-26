'use client';

import { useState, useEffect } from 'react';
import type { EventWithCount } from '@/types/event';

interface EventFilterProps {
  value: string; // '' for all, 'none' for unassigned, event ID for specific event
  onChange: (value: string) => void;
}

/**
 * Filter dropdown for filtering requests by event.
 * Options: "전체", "미할당", and each event.
 */
export function EventFilter({ value, onChange }: EventFilterProps) {
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
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="px-3 py-2 text-sm border border-[rgba(2,9,18,0.15)] rounded bg-white text-[#020912] focus:outline-none focus:ring-2 focus:ring-[#020912]/30 disabled:opacity-50"
    >
      <option value="">전체</option>
      <option value="none">미할당</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name} ({event.participantCount})
        </option>
      ))}
    </select>
  );
}
