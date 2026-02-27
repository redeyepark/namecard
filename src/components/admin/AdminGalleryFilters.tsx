'use client';

import { useState } from 'react';
import type { AdminFilterState, ColorGroup, HashtagCount } from '@/hooks/useAdminFilters';
import type { CardTheme } from '@/types/card';
import type { RequestStatus } from '@/types/request';

interface AdminGalleryFiltersProps {
  filters: AdminFilterState;
  onToggleTheme: (theme: string) => void;
  onToggleStatus: (status: string) => void;
  onSetColorGroup: (group: string) => void;
  onToggleHashtag: (tag: string) => void;
  onSetImageFilter: (filter: string) => void;
  onResetAll: () => void;
  isAnyFilterActive: boolean;
  activeFilterCount: number;
  uniqueHashtags: HashtagCount[];
  colorGroups: ColorGroup[];
  totalCount: number;
  filteredCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const THEME_OPTIONS: { value: CardTheme; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'hearthstone', label: 'Hearthstone' },
  { value: 'harrypotter', label: 'Harry Potter' },
  { value: 'tarot', label: 'Tarot' },
  { value: 'nametag', label: 'Nametag' },
];

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: 'submitted', label: '\uC811\uC218' },
  { value: 'processing', label: '\uC9C4\uD589\uC911' },
  { value: 'revision_requested', label: '\uC218\uC815\uC694\uCCAD' },
  { value: 'confirmed', label: '\uD655\uC815' },
  { value: 'rejected', label: '\uBC18\uB824' },
  { value: 'delivered', label: '\uC804\uB2EC\uC644\uB8CC' },
  { value: 'cancelled', label: '\uCDE8\uC18C' },
];

const HASHTAG_INITIAL_LIMIT = 15;

/**
 * Collapsible filter panel for admin dashboard.
 * Provides multi-select chips for theme, status, color group, hashtags, and image filter.
 * Sits between section header and content area.
 */
export function AdminGalleryFilters({
  filters,
  onToggleTheme,
  onToggleStatus,
  onSetColorGroup,
  onToggleHashtag,
  onSetImageFilter,
  onResetAll,
  isAnyFilterActive,
  activeFilterCount,
  uniqueHashtags,
  colorGroups,
  totalCount,
  filteredCount,
  isOpen,
  onToggleOpen,
}: AdminGalleryFiltersProps) {
  const [showAllHashtags, setShowAllHashtags] = useState(false);

  const visibleHashtags = showAllHashtags
    ? uniqueHashtags
    : uniqueHashtags.slice(0, HASHTAG_INITIAL_LIMIT);
  const hasMoreHashtags = uniqueHashtags.length > HASHTAG_INITIAL_LIMIT;

  return (
    <div>
      {/* Filter toolbar: toggle button + result count + reset */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onToggleOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 ${
            isOpen || activeFilterCount > 0
              ? 'bg-[#020912] text-white'
              : 'bg-white text-[#020912]/70 border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff]'
          }`}
          aria-expanded={isOpen}
          aria-controls="admin-filter-panel"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {'\uD544\uD130'}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-white text-[#020912] rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {isAnyFilterActive && filteredCount !== totalCount && (
          <span className="text-xs text-[#020912]/60">
            {filteredCount}{'\uAC74'} / {'\uC804\uCCB4'} {totalCount}{'\uAC74'}
          </span>
        )}

        {isAnyFilterActive && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs text-[#020912]/50 hover:text-[#020912] underline underline-offset-2 transition-colors"
          >
            {'\uCD08\uAE30\uD654'}
          </button>
        )}
      </div>

      {/* Collapsible filter panel */}
      <div
        id="admin-filter-panel"
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[500px] opacity-100 mb-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#fcfcfc] border border-[rgba(2,9,18,0.08)] p-4 space-y-3">
          {/* Theme filter */}
          <FilterSection label={'\uD14C\uB9C8'}>
            <div className="flex flex-wrap gap-1.5">
              {THEME_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filters.selectedThemes.includes(opt.value)}
                  onClick={() => onToggleTheme(opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Status filter */}
          <FilterSection label={'\uC0C1\uD0DC'}>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filters.selectedStatuses.includes(opt.value)}
                  onClick={() => onToggleStatus(opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Color group filter */}
          {colorGroups.length > 0 && (
            <FilterSection label={'\uBC30\uACBD\uC0C9'}>
              <div className="flex flex-wrap gap-2">
                {colorGroups.map((group) => (
                  <button
                    key={group.name}
                    type="button"
                    onClick={() => onSetColorGroup(group.name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 ${
                      filters.selectedColorGroup === group.name
                        ? 'bg-[#020912] text-white'
                        : 'bg-white text-[#020912]/70 border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff]'
                    }`}
                    aria-pressed={filters.selectedColorGroup === group.name}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                        filters.selectedColorGroup === group.name
                          ? 'border-white ring-1 ring-white'
                          : 'border-[rgba(2,9,18,0.2)]'
                      }`}
                      style={{
                        backgroundColor: group.hex,
                      }}
                      aria-hidden="true"
                    />
                    {group.name}
                    <span className="text-[10px] opacity-60">({group.count})</span>
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Hashtag filter */}
          {uniqueHashtags.length > 0 && (
            <FilterSection label={'\uD0A4\uC6CC\uB4DC'}>
              <div className="flex flex-wrap gap-1.5">
                {visibleHashtags.map((item) => (
                  <FilterChip
                    key={item.tag}
                    label={`#${item.tag}`}
                    active={filters.selectedHashtags.includes(item.tag)}
                    onClick={() => onToggleHashtag(item.tag)}
                    count={item.count}
                  />
                ))}
                {hasMoreHashtags && (
                  <button
                    type="button"
                    onClick={() => setShowAllHashtags(!showAllHashtags)}
                    className="px-2.5 py-1 text-xs font-medium text-[#020912]/50 hover:text-[#020912] underline underline-offset-2 transition-colors"
                  >
                    {showAllHashtags
                      ? '\uC811\uAE30'
                      : `\uB354\uBCF4\uAE30 (+${uniqueHashtags.length - HASHTAG_INITIAL_LIMIT})`}
                  </button>
                )}
              </div>
            </FilterSection>
          )}

          {/* Image filter */}
          <FilterSection label={'\uC774\uBBF8\uC9C0'}>
            <div className="flex gap-0">
              <SegmentButton
                label={'\uC804\uCCB4'}
                active={filters.imageFilter === ''}
                onClick={() => onSetImageFilter('')}
                position="left"
              />
              <SegmentButton
                label={'\uC788\uC74C'}
                active={filters.imageFilter === 'has'}
                onClick={() => onSetImageFilter('has')}
                position="middle"
              />
              <SegmentButton
                label={'\uC5C6\uC74C'}
                active={filters.imageFilter === 'none'}
                onClick={() => onSetImageFilter('none')}
                position="right"
              />
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter section wrapper with a label.
 */
function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-[#020912]/50 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

/**
 * Chip/pill toggle button for multi-select filters.
 */
function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 ${
        active
          ? 'bg-[#020912] text-white'
          : 'bg-white text-[#020912]/70 border border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff]'
      }`}
      aria-pressed={active}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1 text-[10px] opacity-60">({count})</span>
      )}
    </button>
  );
}

/**
 * Segment button for single-select group (image filter).
 */
function SegmentButton({
  label,
  active,
  onClick,
  position,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  position: 'left' | 'middle' | 'right';
}) {
  const borderClass =
    position === 'left'
      ? 'border border-r-0'
      : position === 'right'
        ? 'border border-l-0'
        : 'border';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#020912]/30 ${borderClass} ${
        active
          ? 'bg-[#020912] text-white border-[#020912]'
          : 'bg-white text-[#020912]/70 border-[rgba(2,9,18,0.15)] hover:bg-[#e4f6ff]'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
