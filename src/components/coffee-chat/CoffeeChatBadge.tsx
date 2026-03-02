'use client';

interface CoffeeChatBadgeProps {
  count: number;
}

export default function CoffeeChatBadge({ count }: CoffeeChatBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#f59e0b] text-[#020912] text-[10px] font-bold leading-none"
    >
      {count}
    </span>
  );
}
