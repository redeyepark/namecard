'use client';

type ViewMode = 'table' | 'gallery';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Toggle button group for switching between table and gallery view modes.
 * Active button uses deep navy background; inactive uses white with border.
 */
export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center" role="radiogroup" aria-label="View mode">
      {/* Table (List) view button */}
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`inline-flex items-center justify-center w-8 h-8 transition-colors focus-visible:outline-none focus:ring-2 focus-visible:ring-primary/30 ${
          mode === 'table'
            ? 'bg-primary text-secondary'
            : 'bg-surface text-primary/50 border border-border-medium'
        }`}
        style={{ borderRadius: 0 }}
        role="radio"
        aria-checked={mode === 'table'}
        aria-label="Table view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Gallery (Grid) view button */}
      <button
        type="button"
        onClick={() => onChange('gallery')}
        className={`inline-flex items-center justify-center w-8 h-8 transition-colors focus-visible:outline-none focus:ring-2 focus-visible:ring-primary/30 ${
          mode === 'gallery'
            ? 'bg-primary text-secondary'
            : 'bg-surface text-primary/50 border border-border-medium'
        }`}
        style={{ borderRadius: 0 }}
        role="radio"
        aria-checked={mode === 'gallery'}
        aria-label="Gallery view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>
    </div>
  );
}
