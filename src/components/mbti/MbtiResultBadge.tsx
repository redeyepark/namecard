'use client';

interface MbtiResultBadgeProps {
  mbtiType: string | null;
}

export function MbtiResultBadge({ mbtiType }: MbtiResultBadgeProps) {
  if (!mbtiType) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-[#020912] text-[#fcfcfc] tracking-wider">
      {mbtiType}
    </span>
  );
}
