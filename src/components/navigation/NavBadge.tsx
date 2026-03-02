'use client';

interface NavBadgeProps {
  count: number;
}

export default function NavBadge({ count }: NavBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#020912] text-[#fcfcfc] text-[10px] font-semibold leading-none"
      style={{ borderRadius: '9999px' }}
      aria-label={`${count}건의 알림`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
