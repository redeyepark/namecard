'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { QuestionWithAuthor } from '@/types/question';
import type { ThoughtWithAuthor } from '@/types/question';

/**
 * Represents the loaded thoughts state for a given question.
 */
interface ThoughtsState {
  thoughts: ThoughtWithAuthor[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Format a date string as relative time (e.g., "3일 전", "2시간 전").
 */
function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  if (diffDays > 0) return `${diffDays}일 전`;
  if (diffHours > 0) return `${diffHours}시간 전`;
  if (diffMinutes > 0) return `${diffMinutes}분 전`;
  return '방금 전';
}

export default function AdminQuestionsPage() {
  // Data state
  const [questions, setQuestions] = useState<QuestionWithAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filter state
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const limit = 20;

  // Action loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Expanded thoughts state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [thoughtsMap, setThoughtsMap] = useState<Record<string, ThoughtsState>>({});

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createContent, setCreateContent] = useState('');
  const [createTagInput, setCreateTagInput] = useState('');
  const [createHashtags, setCreateHashtags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (searchQuery) params.set('search', searchQuery);
      params.set('includeInactive', includeInactive.toString());

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data.questions);
      setTotal(data.total);
    } catch {
      setError('질문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, includeInactive]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = questions.filter((q) => q.isActive).length;
    const inactiveCount = questions.filter((q) => !q.isActive).length;
    return { activeCount, inactiveCount };
  }, [questions]);

  // Search handler
  const handleSearch = useCallback(() => {
    setPage(0);
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setPage(0);
  }, []);

  // Toggle active status
  const handleToggleActive = useCallback(
    async (id: string) => {
      setTogglingId(id);
      try {
        const res = await fetch(`/api/admin/questions/${id}`, {
          method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to toggle question');
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, isActive: data.isActive } : q
          )
        );
      } catch {
        alert('상태 변경에 실패했습니다.');
      } finally {
        setTogglingId(null);
      }
    },
    []
  );

  // Delete question
  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('이 질문과 관련된 모든 생각을 영구 삭제하시겠습니까?')) {
        return;
      }
      setDeletingId(id);
      try {
        const res = await fetch(`/api/admin/questions/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete question');
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setTotal((prev) => prev - 1);
      } catch {
        alert('삭제에 실패했습니다.');
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  // Fetch thoughts for a question
  const fetchThoughts = useCallback(
    async (questionId: string, cursor?: string) => {
      setThoughtsMap((prev) => ({
        ...prev,
        [questionId]: {
          ...(prev[questionId] || { thoughts: [], nextCursor: null, hasMore: false }),
          loading: true,
          error: null,
        },
      }));
      try {
        const params = new URLSearchParams();
        params.set('limit', '10');
        params.set('sort', 'latest');
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/questions/${questionId}/thoughts?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch thoughts');
        const data = await res.json();

        setThoughtsMap((prev) => {
          const existing = prev[questionId];
          const prevThoughts = cursor && existing ? existing.thoughts : [];
          return {
            ...prev,
            [questionId]: {
              thoughts: [...prevThoughts, ...data.thoughts],
              loading: false,
              error: null,
              nextCursor: data.nextCursor,
              hasMore: data.hasMore,
            },
          };
        });
      } catch {
        setThoughtsMap((prev) => ({
          ...prev,
          [questionId]: {
            ...(prev[questionId] || { thoughts: [], nextCursor: null, hasMore: false }),
            loading: false,
            error: '답변을 불러오는데 실패했습니다.',
          },
        }));
      }
    },
    []
  );

  // Toggle thoughts expansion
  const handleToggleThoughts = useCallback(
    (questionId: string) => {
      if (expandedQuestionId === questionId) {
        setExpandedQuestionId(null);
        return;
      }
      setExpandedQuestionId(questionId);
      // Only fetch if we haven't loaded yet
      if (!thoughtsMap[questionId]) {
        fetchThoughts(questionId);
      }
    },
    [expandedQuestionId, thoughtsMap, fetchThoughts]
  );

  // Create form: add hashtag
  const handleAddTag = useCallback(() => {
    const cleaned = createTagInput.trim().replace(/^#/, '').toLowerCase();
    if (!cleaned) return;
    if (cleaned.length > 20) {
      setCreateError('해시태그는 최대 20자까지 입력 가능합니다.');
      return;
    }
    if (createHashtags.length >= 5) {
      setCreateError('해시태그는 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    if (createHashtags.includes(cleaned)) {
      setCreateError('이미 추가된 해시태그입니다.');
      return;
    }
    setCreateHashtags((prev) => [...prev, cleaned]);
    setCreateTagInput('');
    setCreateError(null);
  }, [createTagInput, createHashtags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setCreateHashtags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Create question
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setCreateError(null);

      const trimmed = createContent.trim();
      if (trimmed.length < 10) {
        setCreateError('질문은 최소 10자 이상 입력해주세요.');
        return;
      }
      if (trimmed.length > 500) {
        setCreateError('질문은 최대 500자까지 입력 가능합니다.');
        return;
      }

      setCreating(true);
      try {
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmed,
            hashtags: createHashtags,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '질문 생성에 실패했습니다.');
        }

        // Reset form
        setCreateContent('');
        setCreateHashtags([]);
        setCreateTagInput('');
        setShowCreateForm(false);
        // Refresh questions
        fetchQuestions();
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : '질문 생성에 실패했습니다.');
      } finally {
        setCreating(false);
      }
    },
    [createContent, createHashtags, fetchQuestions]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  if (loading && questions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mx-auto mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        로딩 중...
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#020912]">질문 관리</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-4 min-h-[44px] text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/80 transition-colors"
        >
          {showCreateForm ? '닫기' : '새 질문 만들기'}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <span className="text-[#020912]/50">
          전체 <span className="font-medium text-[#020912]">{total}</span>
        </span>
        <span className="text-[#020912]/50">
          활성 <span className="font-medium text-[#020912]">{stats.activeCount}</span>
        </span>
        <span className="text-[#020912]/50">
          비활성 <span className="font-medium text-[#020912]">{stats.inactiveCount}</span>
        </span>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 bg-white border border-[rgba(2,9,18,0.08)] p-4">
          <h2 className="text-sm font-semibold text-[#020912] mb-3">새 질문 작성</h2>
          <form onSubmit={handleCreate}>
            <textarea
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
              placeholder="질문 내용을 입력하세요..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm text-[#020912] bg-[#020912]/[0.02] border border-[rgba(2,9,18,0.15)] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 resize-none transition-all duration-200"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${createContent.length > 500 ? 'text-red-500' : 'text-[#020912]/30'}`}>
                {createContent.length}/500
              </span>
            </div>

            {/* Hashtag input */}
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createTagInput}
                  onChange={(e) => setCreateTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="해시태그 입력 후 Enter"
                  maxLength={20}
                  className="flex-1 px-3 py-1.5 text-sm text-[#020912] bg-[#020912]/[0.02] border border-[rgba(2,9,18,0.15)] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
                >
                  추가
                </button>
              </div>
              {createHashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {createHashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-[#020912]/5 text-[#020912]/70"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#020912]/40 hover:text-[#020912]"
                        aria-label={`${tag} 태그 삭제`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateContent('');
                  setCreateHashtags([]);
                  setCreateTagInput('');
                  setCreateError(null);
                }}
                className="px-4 min-h-[44px] text-sm font-medium text-[#020912]/60 hover:text-[#020912] transition-all duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={creating || createContent.trim().length < 10}
                className="px-4 min-h-[44px] text-sm font-medium text-[#fcfcfc] bg-[#020912] hover:bg-[#020912]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                {creating ? '생성 중...' : '질문 생성'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filter bar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="질문 내용 검색..."
            className="text-sm border border-[rgba(2,9,18,0.15)] bg-white px-3 py-1.5 pr-8 text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 w-64"
            aria-label="질문 내용으로 검색"
          />
          {searchInput !== '' && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#020912]/30 hover:text-[#020912]/60 transition-colors"
              aria-label="검색어 지우기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-3 min-h-[34px] text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] transition-all duration-200"
        >
          검색
        </button>
        <label className="flex items-center gap-1.5 text-sm text-[#020912]/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(0);
            }}
            className="accent-[#020912]"
          />
          비활성 포함
        </label>
        {searchQuery && (
          <span className="text-xs text-[#020912]/40">
            &quot;{searchQuery}&quot; 검색 결과: {total}건
          </span>
        )}
      </div>

      {/* Questions table */}
      {questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다` : '등록된 질문이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[rgba(2,9,18,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">내용</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">작성자</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">해시태그</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">생각</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">작성일</th>
                  <th className="text-left py-3 px-4 font-medium text-[#020912]/60">작업</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => {
                  const isExpanded = expandedQuestionId === q.id;
                  const thoughtsState = thoughtsMap[q.id];
                  return (
                    <React.Fragment key={q.id}>
                      <tr
                        className="border-b border-[rgba(2,9,18,0.08)] hover:bg-[#e4f6ff]/50 transition-colors"
                      >
                        {/* Content (truncated) - clickable to expand thoughts */}
                        <td className="py-3 px-4 text-[#020912] max-w-[280px]">
                          <button
                            type="button"
                            onClick={() => handleToggleThoughts(q.id)}
                            className="text-left w-full hover:text-[#020912]/70 transition-colors cursor-pointer"
                            title={q.content}
                            aria-expanded={isExpanded}
                            aria-label={`질문 답변 ${isExpanded ? '접기' : '펼치기'}`}
                          >
                            <span className="flex items-center gap-1.5">
                              <svg
                                className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 text-[#020912]/40 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                              <span>
                                {q.content.length > 60
                                  ? q.content.slice(0, 60) + '...'
                                  : q.content}
                              </span>
                            </span>
                          </button>
                        </td>

                        {/* Author */}
                        <td className="py-3 px-4 text-[#020912]/70 whitespace-nowrap">
                          {q.author.displayName}
                        </td>

                        {/* Hashtags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {q.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-[#020912]/5 text-[#020912]/60"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Thought count - clickable to expand */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleThoughts(q.id)}
                            className={`inline-flex items-center gap-1 text-sm tabular-nums transition-colors ${
                              q.thoughtCount > 0
                                ? 'text-[#020912]/70 hover:text-[#020912] cursor-pointer'
                                : 'text-[#020912]/30 hover:text-[#020912]/50 cursor-pointer'
                            }`}
                            aria-expanded={isExpanded}
                            aria-label={`답변 ${q.thoughtCount}개 ${isExpanded ? '접기' : '펼치기'}`}
                          >
                            {q.thoughtCount > 0 && (
                              <svg
                                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            )}
                            {q.thoughtCount}
                          </button>
                        </td>

                        {/* Status badge */}
                        <td className="py-3 px-4">
                          {q.isActive ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-[#dbe9e0] text-[#020912]">
                              활성
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                              비활성
                            </span>
                          )}
                        </td>

                        {/* Created date */}
                        <td className="py-3 px-4 text-[#020912]/50 whitespace-nowrap">
                          {formatRelativeTime(q.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(q.id)}
                              disabled={togglingId === q.id}
                              className="text-sm text-[#020912]/60 hover:text-[#020912] transition-colors disabled:opacity-50"
                            >
                              {togglingId === q.id
                                ? '처리 중...'
                                : q.isActive
                                  ? '비활성화'
                                  : '활성화'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(q.id)}
                              disabled={deletingId === q.id}
                              className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              {deletingId === q.id ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded thoughts row */}
                      {isExpanded && (
                        <tr className="border-b border-[rgba(2,9,18,0.08)]">
                          <td colSpan={7} className="p-0">
                            <div className="bg-[#f8f9fa] px-6 py-4">
                              <h3 className="text-xs font-semibold text-[#020912]/50 uppercase tracking-wider mb-3">
                                답변 목록 ({q.thoughtCount})
                              </h3>

                              {/* Loading state */}
                              {thoughtsState?.loading && thoughtsState.thoughts.length === 0 && (
                                <div className="text-center py-4 text-[#020912]/40 text-sm">
                                  <svg
                                    className="animate-spin h-4 w-4 mx-auto mb-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  답변 로딩 중...
                                </div>
                              )}

                              {/* Error state */}
                              {thoughtsState?.error && (
                                <div className="text-center py-3 text-red-500 text-sm">
                                  {thoughtsState.error}
                                  <button
                                    type="button"
                                    onClick={() => fetchThoughts(q.id)}
                                    className="ml-2 text-[#020912]/60 hover:text-[#020912] underline"
                                  >
                                    재시도
                                  </button>
                                </div>
                              )}

                              {/* Thoughts list */}
                              {thoughtsState && thoughtsState.thoughts.length > 0 && (
                                <div className="space-y-2">
                                  {thoughtsState.thoughts.map((thought) => (
                                    <div
                                      key={thought.id}
                                      className="bg-white border border-[rgba(2,9,18,0.06)] px-4 py-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-[#020912] whitespace-pre-wrap break-words">
                                            {thought.content}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-[#020912]/40">
                                        <span className="font-medium text-[#020912]/60">
                                          {thought.author.displayName}
                                        </span>
                                        <span>{formatRelativeTime(thought.createdAt)}</span>
                                        <span className="inline-flex items-center gap-0.5">
                                          <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            aria-hidden="true"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                          </svg>
                                          {thought.likeCount}
                                        </span>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Load more button */}
                                  {thoughtsState.hasMore && (
                                    <div className="text-center pt-2">
                                      <button
                                        type="button"
                                        onClick={() => fetchThoughts(q.id, thoughtsState.nextCursor || undefined)}
                                        disabled={thoughtsState.loading}
                                        className="text-sm text-[#020912]/60 hover:text-[#020912] transition-colors disabled:opacity-50"
                                      >
                                        {thoughtsState.loading ? '로딩 중...' : '더 보기'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Empty state */}
                              {thoughtsState && !thoughtsState.loading && !thoughtsState.error && thoughtsState.thoughts.length === 0 && (
                                <p className="text-center py-3 text-sm text-[#020912]/30">
                                  아직 답변이 없습니다.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canGoPrev || loading}
            className="px-4 min-h-[44px] text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            이전
          </button>
          <span className="text-sm text-[#020912]/50">
            {page + 1} / {totalPages} 페이지
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canGoNext || loading}
            className="px-4 min-h-[44px] text-sm font-medium text-[#020912] border border-[rgba(2,9,18,0.15)] hover:border-[rgba(2,9,18,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
