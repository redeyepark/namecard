'use client';

import type { DiscoverableMember } from '@/types/coffee-chat';
import MemberCard from './MemberCard';

interface MemberDiscoverGridProps {
  members: DiscoverableMember[];
  hasMore: boolean;
  sentinelRef: (node?: Element | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  onRequestClick: (member: DiscoverableMember) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function SkeletonCard() {
  return (
    <div className="border border-[rgba(2,9,18,0.1)] bg-white p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-[#020912]/10" />
        <div className="flex-1 min-w-0">
          <div className="h-3.5 bg-[#020912]/10 w-20 mb-1.5" />
          <div className="h-2.5 bg-[#020912]/5 w-14" />
        </div>
      </div>
      <div className="h-2.5 bg-[#020912]/5 w-full mb-1" />
      <div className="h-2.5 bg-[#020912]/5 w-3/4 mb-3" />
      <div className="h-8 bg-[#020912]/5 w-full mt-3" />
    </div>
  );
}

export default function MemberDiscoverGrid({
  members,
  hasMore,
  sentinelRef,
  loading,
  isAuthenticated,
  onRequestClick,
  searchQuery,
  onSearchChange,
}: MemberDiscoverGridProps) {
  const showSkeleton = loading && members.length === 0;
  const showEmpty = !loading && members.length === 0;

  return (
    <div>
      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={'\ud68c\uc6d0 \uac80\uc0c9...'}
        className="w-full border border-[rgba(2,9,18,0.15)] p-3 text-sm text-[#020912] placeholder:text-[#020912]/30 mb-4 focus:outline-none focus:border-[#020912]/40 bg-white"
      />

      {/* Skeleton loading state */}
      {showSkeleton && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="text-center py-12">
          <p className="text-sm text-[#020912]/40">
            {searchQuery
              ? '\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4'
              : '\ucee4\ud53c\ucc57 \uac00\ub2a5\ud55c \ud68c\uc6d0\uc774 \uc5c6\uc2b5\ub2c8\ub2e4'}
          </p>
        </div>
      )}

      {/* Member grid */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAuthenticated={isAuthenticated}
              onRequestClick={onRequestClick}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loading && members.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#020912]/20 border-t-[#020912] rounded-full animate-spin" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="h-px" />
      )}
    </div>
  );
}
