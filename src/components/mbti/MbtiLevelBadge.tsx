'use client';

interface MbtiLevelBadgeProps {
  level: number;
}

export function MbtiLevelBadge({ level }: MbtiLevelBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
      Lv.{level}
    </span>
  );
}
