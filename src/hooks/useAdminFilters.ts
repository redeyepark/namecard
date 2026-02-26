import { useState, useMemo, useCallback } from 'react';
import type { RequestSummary } from '@/types/request';

export interface AdminFilterState {
  searchQuery: string;
  eventFilter: string; // '' = all, 'none' = unassigned, eventId
  selectedThemes: string[]; // multi-select, empty = all
  selectedStatuses: string[]; // multi-select, empty = all
  selectedColorGroup: string; // '' = all, color group name
  selectedHashtags: string[]; // multi-select OR logic, empty = all
  imageFilter: string; // '' = all, 'has' = has illustration, 'none' = no illustration
}

export interface ColorGroup {
  name: string;
  hex: string;
  count: number;
}

export interface HashtagCount {
  tag: string;
  count: number;
}

export interface UseAdminFiltersReturn {
  // Filter state
  filters: AdminFilterState;
  // Setters
  setSearchQuery: (q: string) => void;
  setEventFilter: (e: string) => void;
  toggleTheme: (theme: string) => void;
  toggleStatus: (status: string) => void;
  setColorGroup: (group: string) => void;
  toggleHashtag: (tag: string) => void;
  setImageFilter: (filter: string) => void;
  resetAllFilters: () => void;
  // Computed
  filteredRequests: RequestSummary[];
  isAnyFilterActive: boolean;
  activeFilterCount: number;
  // Unique values for filter UI
  uniqueHashtags: HashtagCount[];
  colorGroups: ColorGroup[];
}

// Representative hex colors for each color group swatch
const COLOR_GROUP_DISPLAY: Record<string, string> = {
  Dark: '#1a1a1a',
  Light: '#f0f0f0',
  Red: '#ef4444',
  Orange: '#f59e0b',
  Green: '#10b981',
  Blue: '#3b82f6',
  Purple: '#8b5cf6',
};

/**
 * Convert a hex color string to HSL values.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove leading # if present
  const clean = hex.replace(/^#/, '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

/**
 * Classify a hex color into a named color group.
 */
function getColorGroupName(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (s < 10) return l < 50 ? 'Dark' : 'Light'; // Neutral
  if (h < 30 || h >= 330) return 'Red';
  if (h < 75) return 'Orange';
  if (h < 150) return 'Green';
  if (h < 260) return 'Blue';
  if (h < 330) return 'Purple';
  return 'Red';
}

const INITIAL_FILTER_STATE: AdminFilterState = {
  searchQuery: '',
  eventFilter: '',
  selectedThemes: [],
  selectedStatuses: [],
  selectedColorGroup: '',
  selectedHashtags: [],
  imageFilter: '',
};

/**
 * Custom hook for managing admin dashboard filter state and logic.
 * Provides filter state, setters, filtered results, and computed values for filter UI.
 * All filters are combined with AND logic. Hashtag filter uses OR logic within selected tags.
 */
export function useAdminFilters(requests: RequestSummary[]): UseAdminFiltersReturn {
  const [filters, setFilters] = useState<AdminFilterState>(INITIAL_FILTER_STATE);

  const setSearchQuery = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: q }));
  }, []);

  const setEventFilter = useCallback((e: string) => {
    setFilters((prev) => ({ ...prev, eventFilter: e }));
  }, []);

  const toggleTheme = useCallback((theme: string) => {
    setFilters((prev) => {
      const has = prev.selectedThemes.includes(theme);
      return {
        ...prev,
        selectedThemes: has
          ? prev.selectedThemes.filter((t) => t !== theme)
          : [...prev.selectedThemes, theme],
      };
    });
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setFilters((prev) => {
      const has = prev.selectedStatuses.includes(status);
      return {
        ...prev,
        selectedStatuses: has
          ? prev.selectedStatuses.filter((s) => s !== status)
          : [...prev.selectedStatuses, status],
      };
    });
  }, []);

  const setColorGroup = useCallback((group: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedColorGroup: prev.selectedColorGroup === group ? '' : group,
    }));
  }, []);

  const toggleHashtag = useCallback((tag: string) => {
    setFilters((prev) => {
      const has = prev.selectedHashtags.includes(tag);
      return {
        ...prev,
        selectedHashtags: has
          ? prev.selectedHashtags.filter((t) => t !== tag)
          : [...prev.selectedHashtags, tag],
      };
    });
  }, []);

  const setImageFilter = useCallback((filter: string) => {
    setFilters((prev) => ({ ...prev, imageFilter: filter }));
  }, []);

  const resetAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  // Compute unique hashtags with frequency counts, sorted by count descending
  const uniqueHashtags = useMemo<HashtagCount[]>(() => {
    const tagMap = new Map<string, number>();
    for (const req of requests) {
      if (req.hashtags) {
        for (const tag of req.hashtags) {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        }
      }
    }
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  // Compute color groups from request backgroundColor values
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const groupMap = new Map<string, number>();
    for (const req of requests) {
      if (req.backgroundColor) {
        const groupName = getColorGroupName(req.backgroundColor);
        groupMap.set(groupName, (groupMap.get(groupName) || 0) + 1);
      }
    }
    return Array.from(groupMap.entries())
      .map(([name, count]) => ({
        name,
        hex: COLOR_GROUP_DISPLAY[name] || '#888888',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  // Apply all filters with AND logic
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Event filter (single select)
    if (filters.eventFilter === 'none') {
      filtered = filtered.filter((r) => !r.eventId);
    } else if (filters.eventFilter !== '') {
      filtered = filtered.filter((r) => r.eventId === filters.eventFilter);
    }

    // Search query (case-insensitive match on displayName or id)
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.displayName.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query)
      );
    }

    // Theme filter (multi-select, empty = show all)
    if (filters.selectedThemes.length > 0) {
      filtered = filtered.filter((r) => {
        const theme = r.theme || 'classic';
        return filters.selectedThemes.includes(theme);
      });
    }

    // Status filter (multi-select, empty = show all)
    if (filters.selectedStatuses.length > 0) {
      filtered = filtered.filter((r) =>
        filters.selectedStatuses.includes(r.status)
      );
    }

    // Color group filter (single select)
    if (filters.selectedColorGroup !== '') {
      filtered = filtered.filter((r) => {
        if (!r.backgroundColor) return false;
        return getColorGroupName(r.backgroundColor) === filters.selectedColorGroup;
      });
    }

    // Hashtag filter (multi-select with OR logic)
    if (filters.selectedHashtags.length > 0) {
      filtered = filtered.filter((r) => {
        if (!r.hashtags || r.hashtags.length === 0) return false;
        return filters.selectedHashtags.some((tag) => r.hashtags!.includes(tag));
      });
    }

    // Image filter
    if (filters.imageFilter === 'has') {
      filtered = filtered.filter((r) => !!r.illustrationUrl);
    } else if (filters.imageFilter === 'none') {
      filtered = filtered.filter((r) => !r.illustrationUrl);
    }

    return filtered;
  }, [requests, filters]);

  // Count active filters (excluding search and event which have their own UI)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.selectedThemes.length > 0) count++;
    if (filters.selectedStatuses.length > 0) count++;
    if (filters.selectedColorGroup !== '') count++;
    if (filters.selectedHashtags.length > 0) count++;
    if (filters.imageFilter !== '') count++;
    return count;
  }, [filters]);

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.eventFilter !== '' ||
      filters.selectedThemes.length > 0 ||
      filters.selectedStatuses.length > 0 ||
      filters.selectedColorGroup !== '' ||
      filters.selectedHashtags.length > 0 ||
      filters.imageFilter !== ''
    );
  }, [filters]);

  return {
    filters,
    setSearchQuery,
    setEventFilter,
    toggleTheme,
    toggleStatus,
    setColorGroup,
    toggleHashtag,
    setImageFilter,
    resetAllFilters,
    filteredRequests,
    isAnyFilterActive,
    activeFilterCount,
    uniqueHashtags,
    colorGroups,
  };
}
