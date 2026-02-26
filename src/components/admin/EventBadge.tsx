'use client';

interface EventBadgeProps {
  eventName?: string;
}

/**
 * Badge displaying event assignment status.
 * Blue badge with event name when assigned, gray "미할당" when unassigned.
 */
export function EventBadge({ eventName }: EventBadgeProps) {
  if (!eventName) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        미할당
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 max-w-[120px] truncate">
      {eventName}
    </span>
  );
}
