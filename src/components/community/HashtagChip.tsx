'use client';

interface HashtagChipProps {
  tag: string;
  onClick?: (tag: string) => void;
  isActive?: boolean;
}

export function HashtagChip({ tag, onClick, isActive = false }: HashtagChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(tag)}
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-[#020912] text-[#fcfcfc]'
          : 'bg-[#020912]/5 text-[#020912]/70 hover:bg-[#020912]/10'
      }`}
    >
      {tag.startsWith('#') ? tag : `#${tag}`}
    </button>
  );
}
