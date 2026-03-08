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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(tag);
      }}
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-primary text-secondary'
          : 'bg-primary/5 text-primary/70 hover:bg-primary/10'
      }`}
    >
      {tag.startsWith('#') ? tag : `#${tag}`}
    </button>
  );
}
