'use client';

interface SurveyFiltersProps {
  currentSort: 'latest' | 'popular';
  currentTag: string | null;
  onSortChange: (sort: 'latest' | 'popular') => void;
  onTagClear: () => void;
}

export function SurveyFilters({
  currentSort,
  currentTag,
  onSortChange,
  onTagClear,
}: SurveyFiltersProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSortChange('latest')}
          className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            currentSort === 'latest'
              ? 'text-primary border-b-2 border-primary'
              : 'text-primary/40 hover:text-primary/70'
          }`}
        >
          최신순
        </button>
        <button
          type="button"
          onClick={() => onSortChange('popular')}
          className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            currentSort === 'popular'
              ? 'text-primary border-b-2 border-primary'
              : 'text-primary/40 hover:text-primary/70'
          }`}
        >
          인기순
        </button>
      </div>

      {currentTag && (
        <button
          type="button"
          onClick={onTagClear}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary text-secondary transition-all duration-200 hover:bg-primary/80"
        >
          #{currentTag}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
