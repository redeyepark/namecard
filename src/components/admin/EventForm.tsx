'use client';

import { useState, useCallback } from 'react';
import type { EventWithCount } from '@/types/event';

interface EventFormProps {
  event?: EventWithCount;
  onSave: (event: EventWithCount) => void;
  onCancel: () => void;
}

/**
 * Form for creating/editing an event.
 * Fields: name (required), description, event_date, location.
 */
export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState(event?.eventDate || '');
  const [location, setLocation] = useState(event?.location || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!event;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
        setError('이벤트 이름을 입력해 주세요.');
        return;
      }

      setLoading(true);

      try {
        const url = isEdit ? `/api/events/${event.id}` : '/api/events';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            eventDate: eventDate || undefined,
            location: location.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.details || data.error || 'Failed to save event');
        }

        const saved: EventWithCount = await res.json();
        onSave(saved);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [name, description, eventDate, location, isEdit, event, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
          이벤트 이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="event-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="이벤트 이름 (최대 100자)"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="이벤트 설명 (최대 500자)"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
            날짜
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
            장소
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="장소 (최대 200자)"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '저장 중...' : isEdit ? '수정' : '생성'}
        </button>
      </div>
    </form>
  );
}
