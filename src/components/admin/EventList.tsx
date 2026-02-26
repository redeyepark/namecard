'use client';

import { useState, useCallback } from 'react';
import type { EventWithCount } from '@/types/event';

interface EventListProps {
  events: EventWithCount[];
  onEdit: (event: EventWithCount) => void;
  onDelete: (event: EventWithCount) => void;
  onViewParticipants: (event: EventWithCount) => void;
}

/**
 * Table displaying events with participant counts and actions.
 */
export function EventList({ events, onEdit, onDelete, onViewParticipants }: EventListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(
    async (event: EventWithCount) => {
      if (event.participantCount > 0) {
        alert(`이 이벤트에 ${event.participantCount}명의 참여자가 있어 삭제할 수 없습니다.\n참여자를 먼저 다른 이벤트로 이동하거나 할당 해제해 주세요.`);
        return;
      }

      if (deleteConfirm !== event.id) {
        setDeleteConfirm(event.id);
        return;
      }

      setDeleting(true);
      try {
        onDelete(event);
      } finally {
        setDeleting(false);
        setDeleteConfirm(null);
      }
    },
    [deleteConfirm, onDelete]
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">등록된 이벤트가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이벤트 이름</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">날짜</th>
            <th className="text-left py-3 px-4 font-medium text-[#020912]/60">장소</th>
            <th className="text-center py-3 px-4 font-medium text-[#020912]/60">참여자</th>
            <th className="text-right py-3 px-4 font-medium text-[#020912]/60">작업</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const dateFormatted = event.eventDate
              ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '-';

            return (
              <tr
                key={event.id}
                className="border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff] transition-colors"
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="text-[#020912] font-medium">{event.name}</p>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">
                        {event.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#020912]/50">{dateFormatted}</td>
                <td className="py-3 px-4 text-[#020912]/50">{event.location || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onViewParticipants(event)}
                    className="inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    {event.participantCount}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(event)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      disabled={deleting}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        deleteConfirm === event.id
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {deleteConfirm === event.id ? '확인' : '삭제'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
