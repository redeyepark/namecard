'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventList } from '@/components/admin/EventList';
import { EventForm } from '@/components/admin/EventForm';
import { EventPdfDownload } from '@/components/admin/EventPdfDownload';
import type { EventWithCount } from '@/types/event';
import type { EventParticipant } from '@/types/event';

type PageView = 'list' | 'create' | 'edit' | 'participants';

interface MigrationStatus {
  migrations: {
    '005_add_visibility': boolean;
    '006_add_events': boolean;
  };
}

const MIGRATION_SQL = `-- Migration 005: Add visibility
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_card_requests_is_public ON card_requests (is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_card_requests_public_status ON card_requests (is_public, status) WHERE is_public = TRUE AND status IN ('confirmed', 'delivered');

-- Migration 006: Add events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  event_date DATE,
  location TEXT CHECK (char_length(location) <= 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_card_requests_event_id ON card_requests(event_id);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authenticated users can read events') THEN
    CREATE POLICY "Authenticated users can read events" ON events FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authenticated users can manage events') THEN
    CREATE POLICY "Authenticated users can manage events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;`;

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PageView>('list');
  const [selectedEvent, setSelectedEvent] = useState<EventWithCount | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchMigrationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/migrate');
      if (res.ok) {
        const data = await res.json() as MigrationStatus;
        setMigrationStatus(data);
      }
    } catch {
      // Silently fail
    } finally {
      setMigrationChecked(true);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchMigrationStatus();
    fetchEvents();
  }, [fetchEvents, fetchMigrationStatus]);

  const handleCreate = useCallback(
    (saved: EventWithCount) => {
      setEvents((prev) => [saved, ...prev]);
      setView('list');
    },
    []
  );

  const handleEdit = useCallback(
    (saved: EventWithCount) => {
      setEvents((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setView('list');
      setSelectedEvent(null);
    },
    []
  );

  const handleDelete = useCallback(
    async (event: EventWithCount) => {
      try {
        const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
        if (res.ok) {
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || '삭제에 실패했습니다.');
        }
      } catch {
        alert('네트워크 오류가 발생했습니다.');
      }
    },
    []
  );

  const handleViewParticipants = useCallback(
    async (event: EventWithCount) => {
      setSelectedEvent(event);
      setView('participants');
      setParticipantsLoading(true);
      try {
        const res = await fetch(`/api/events/${event.id}/participants`);
        if (res.ok) {
          const data = await res.json();
          setParticipants(data.participants || []);
        }
      } catch {
        // Silently fail
      } finally {
        setParticipantsLoading(false);
      }
    },
    []
  );

  const handleCopySQL = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert('SQL 복사에 실패했습니다.');
    }
  }, []);

  const handleRecheckMigration = useCallback(async () => {
    setMigrationChecked(false);
    await fetchMigrationStatus();
  }, [fetchMigrationStatus]);

  if (loading || !migrationChecked) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mx-auto mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        로딩 중...
      </div>
    );
  }

  // Show migration setup UI if migration 006 is not applied
  if (migrationStatus && !migrationStatus.migrations['006_add_events']) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#020912]">데이터베이스 설정 필요</h1>
          <p className="mt-1 text-sm text-[#020912]/50">
            이벤트 기능을 사용하려면 데이터베이스 마이그레이션을 실행해야 합니다.
          </p>
        </div>

        <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#020912] mb-4">실행할 SQL</h2>
            <pre className="bg-[#f5f5f5] border border-[rgba(2,9,18,0.15)] rounded p-4 overflow-x-auto text-sm font-mono text-[#020912] whitespace-pre-wrap break-words">
              {MIGRATION_SQL}
            </pre>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#020912] mb-2">실행 방법</h3>
            <p className="text-sm text-[#020912]/70">
              Supabase Dashboard &gt; SQL Editor에서 위 SQL을 실행하세요.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopySQL}
              className="flex-1 min-h-[44px] px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {copySuccess ? '복사됨!' : 'SQL 복사'}
            </button>
            <button
              onClick={handleRecheckMigration}
              className="flex-1 min-h-[44px] px-4 bg-[#fcfcfc] text-[#020912] text-sm font-medium rounded-lg border border-[rgba(2,9,18,0.15)] hover:bg-[#f5f5f5] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              다시 확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#020912]">이벤트 관리</h1>
          <p className="mt-1 text-sm text-[#020912]/50">
            이벤트를 생성하고 참여자를 관리합니다.
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="min-h-[44px] px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 이벤트
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={() => {
              setView('list');
              setSelectedEvent(null);
            }}
            className="min-h-[44px] px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            목록으로
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="bg-white border border-[rgba(2,9,18,0.15)]">
          <EventList
            events={events}
            onEdit={(event) => {
              setSelectedEvent(event);
              setView('edit');
            }}
            onDelete={handleDelete}
            onViewParticipants={handleViewParticipants}
          />
        </div>
      )}

      {view === 'create' && (
        <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">새 이벤트 생성</h2>
          <EventForm
            onSave={handleCreate}
            onCancel={() => setView('list')}
          />
        </div>
      )}

      {view === 'edit' && selectedEvent && (
        <div className="bg-white border border-[rgba(2,9,18,0.15)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이벤트 수정</h2>
          <EventForm
            event={selectedEvent}
            onSave={handleEdit}
            onCancel={() => {
              setView('list');
              setSelectedEvent(null);
            }}
          />
        </div>
      )}

      {view === 'participants' && selectedEvent && (
        <div className="bg-white border border-[rgba(2,9,18,0.15)]">
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedEvent.name} - 참여자 목록
              </h2>
              {selectedEvent.eventDate && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedEvent.eventDate + 'T00:00:00').toLocaleDateString('ko-KR')}
                  {selectedEvent.location ? ` | ${selectedEvent.location}` : ''}
                </p>
              )}
            </div>
            <EventPdfDownload
              eventId={selectedEvent.id}
              eventName={selectedEvent.name}
              participantCount={participants.length}
            />
          </div>

          {participantsLoading ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="animate-spin h-6 w-6 mx-auto mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              로딩 중...
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">참여자가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-[#020912]/60">이메일</th>
                    <th className="text-left py-3 px-4 font-medium text-[#020912]/60">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-[#020912]/60">제출일</th>
                    <th className="text-left py-3 px-4 font-medium text-[#020912]/60">테마</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr
                      key={p.requestId}
                      className="border-b border-[rgba(2,9,18,0.08)]"
                    >
                      <td className="py-3 px-4 text-[#020912] font-medium">{p.displayName}</td>
                      <td className="py-3 px-4 text-[#020912]/50">{p.email || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#020912]/50">
                        {new Date(p.submittedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-[#020912]/50">{p.theme || 'classic'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
