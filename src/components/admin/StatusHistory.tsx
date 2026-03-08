import type { StatusHistoryEntry } from '@/types/request';
import { StatusBadge } from './StatusBadge';

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
}

export function StatusHistory({ history }: StatusHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-text-primary mb-3">상태 이력</h3>
      <div className="space-y-3">
        {history.map((entry, index) => {
          const date = new Date(entry.timestamp);
          const formatted = date.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-border-medium" />
                  {index < history.length - 1 && (
                    <div className="absolute top-3 left-1 w-0.5 h-4 bg-divider" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <StatusBadge status={entry.status} />
                  <span className="text-xs text-text-secondary truncate">
                    {formatted}
                  </span>
                </div>
              </div>
              {entry.adminFeedback && (
                <div className="ml-[22px] mt-1 bg-bg rounded p-2">
                  <p className="text-xs text-text-secondary italic">
                    <span className="font-medium not-italic text-text-primary">관리자 피드백:</span>{' '}
                    {entry.adminFeedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
