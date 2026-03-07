'use client';

interface MbtiLevelBadgeProps {
  level: number;
}

export function MbtiLevelBadge({ level }: MbtiLevelBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#020912]/10 text-[#020912]">
      Lv.{level}
    </span>
  );
}
