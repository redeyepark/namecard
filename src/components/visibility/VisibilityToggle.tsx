'use client';

interface VisibilityToggleProps {
  isPublic: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onToggle: (isPublic: boolean) => void;
}

/**
 * Toggle switch for card public/private visibility.
 * Shows a tooltip when disabled explaining the reason.
 */
export function VisibilityToggle({
  isPublic,
  disabled = false,
  disabledReason,
  onToggle,
}: VisibilityToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label={isPublic ? '명함 공개 상태' : '명함 비공개 상태'}
          disabled={disabled}
          onClick={() => onToggle(!isPublic)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#020912]
            ${isPublic
              ? 'bg-[#2d8c3c]'
              : 'bg-gray-300'
            }
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm
              ${isPublic ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>

        {/* Disabled tooltip */}
        {disabled && disabledReason && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {disabledReason}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
          </div>
        )}
      </div>

      <span className="text-sm text-[#020912]/70">
        {isPublic ? '공개' : '비공개'}
      </span>
    </div>
  );
}
