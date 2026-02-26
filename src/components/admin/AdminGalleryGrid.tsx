'use client';

import type { RequestSummary } from '@/types/request';
import { AdminGalleryCard } from '@/components/admin/AdminGalleryCard';

interface AdminGalleryGridProps {
  requests: RequestSummary[];
}

/**
 * Responsive grid layout for admin gallery cards.
 * Displays RequestSummary items as visual card thumbnails.
 */
export function AdminGalleryGrid({ requests }: AdminGalleryGridProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-[#020912]/50 text-sm">
        표시할 의뢰가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {requests.map((request) => (
        <AdminGalleryCard key={request.id} request={request} />
      ))}
    </div>
  );
}
