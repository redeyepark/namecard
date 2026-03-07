import { getSupabase } from './supabase';
import type { QuestionWithAuthor, ThoughtWithAuthor } from '@/types/question';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove HTML tags from text for XSS prevention.
 * Uses a simple regex-based approach suitable for user-generated content sanitization.
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Map a snake_case community_questions DB row to a camelCase object.
 */
function mapQuestionRow(
  row: Record<string, unknown>,
  author: { id: string; displayName: string; avatarUrl: string | null },
  isOwner: boolean
): QuestionWithAuthor {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    content: row.content as string,
    hashtags: (row.hashtags as string[]) || [],
    thoughtCount: (row.thought_count as number) ?? 0,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author,
    isOwner,
  };
}

/**
 * Map a snake_case community_thoughts DB row to a camelCase object.
 */
function mapThoughtRow(
  row: Record<string, unknown>,
  author: { id: string; displayName: string; avatarUrl: string | null },
  isOwner: boolean,
  isLiked: boolean
): ThoughtWithAuthor {
  return {
    id: row.id as string,
    questionId: row.question_id as string,
    authorId: row.author_id as string,
    content: row.content as string,
    likeCount: (row.like_count as number) ?? 0,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author,
    isOwner,
    isLiked,
  };
}

/**
 * Batch-fetch user profiles by their IDs.
 * Returns a map from userId to { id, displayName, avatarUrl }.
 */
async function fetchAuthorProfiles(
  authorIds: string[]
): Promise<Map<string, { id: string; displayName: string; avatarUrl: string | null }>> {
  const profileMap = new Map<string, { id: string; displayName: string; avatarUrl: string | null }>();
  if (authorIds.length === 0) return profileMap;

  const supabase = getSupabase();
  const uniqueIds = [...new Set(authorIds)];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_url')
    .in('id', uniqueIds);

  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id as string, {
        id: p.id as string,
        displayName: (p.display_name as string) || 'Anonymous',
        avatarUrl: (p.avatar_url as string) || null,
      });
    }
  }

  return profileMap;
}

/**
 * Get author profile for a single user, with fallback to 'Anonymous'.
 */
function getAuthorFromMap(
  profileMap: Map<string, { id: string; displayName: string; avatarUrl: string | null }>,
  authorId: string
): { id: string; displayName: string; avatarUrl: string | null } {
  return profileMap.get(authorId) || { id: authorId, displayName: 'Anonymous', avatarUrl: null };
}

// ---------------------------------------------------------------------------
// Rate Limiting (DB-based, Cloudflare Workers compatible)
// ---------------------------------------------------------------------------

/**
 * Check if user is rate limited for creating questions.
 * Limit: max 1 question per 60 seconds.
 * @returns true if rate limited (should NOT proceed)
 */
export async function checkQuestionRateLimit(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { count } = await supabase
    .from('community_questions')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', oneMinuteAgo);

  return count !== null && count >= 1;
}

/**
 * Check if user is rate limited for creating thoughts on a specific question.
 * Limit: max 1 thought per 30 seconds per question.
 * @returns true if rate limited (should NOT proceed)
 */
export async function checkThoughtRateLimit(userId: string, questionId: string): Promise<boolean> {
  const supabase = getSupabase();
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

  const { count } = await supabase
    .from('community_thoughts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .eq('question_id', questionId)
    .gte('created_at', thirtySecondsAgo);

  return count !== null && count >= 1;
}

/**
 * Check if user is rate limited for liking thoughts.
 * Limit: max 100 likes per hour.
 * @returns true if rate limited (should NOT proceed)
 */
export async function checkLikeRateLimit(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('thought_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  return count !== null && count >= 100;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/**
 * Get questions with cursor-based pagination and optional filters.
 *
 * Cursor strategy:
 *  - 'latest' sort:  cursor = ISO timestamp (created_at), ordered DESC
 *  - 'popular' sort: cursor = "{thought_count}_{id}", ordered by thought_count DESC, created_at DESC
 *
 * Fetches limit+1 rows to determine hasMore, then returns at most `limit` items.
 */
export async function getQuestions(options: {
  cursor?: string;
  limit?: number;
  sort?: 'latest' | 'popular';
  tag?: string;
  userId?: string;
}): Promise<{ questions: QuestionWithAuthor[]; nextCursor: string | null; hasMore: boolean }> {
  const supabase = getSupabase();
  const limit = options.limit ?? 20;
  const sort = options.sort ?? 'latest';
  const fetchCount = limit + 1;

  let query = supabase
    .from('community_questions')
    .select('*')
    .eq('is_active', true);

  // Tag filter: PostgreSQL array containment
  if (options.tag) {
    query = query.contains('hashtags', [options.tag]);
  }

  // Cursor-based pagination
  if (sort === 'latest') {
    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }
    query = query.order('created_at', { ascending: false });
  } else {
    // 'popular' sort: order by thought_count DESC, then created_at DESC
    if (options.cursor) {
      // cursor format: "{thought_count}_{id}"
      const separatorIndex = options.cursor.indexOf('_');
      if (separatorIndex !== -1) {
        const cursorCount = parseInt(options.cursor.substring(0, separatorIndex), 10);
        const cursorId = options.cursor.substring(separatorIndex + 1);

        // Items with fewer thoughts, OR same thought_count but later id (for stable ordering)
        query = query.or(
          `thought_count.lt.${cursorCount},and(thought_count.eq.${cursorCount},id.lt.${cursorId})`
        );
      }
    }
    query = query
      .order('thought_count', { ascending: false })
      .order('created_at', { ascending: false });
  }

  query = query.limit(fetchCount);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { questions: [], nextCursor: null, hasMore: false };
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Batch-fetch author profiles
  const authorIds = items.map((r) => r.author_id as string);
  const profileMap = await fetchAuthorProfiles(authorIds);

  const questions: QuestionWithAuthor[] = items.map((row) => {
    const author = getAuthorFromMap(profileMap, row.author_id as string);
    const isOwner = options.userId ? row.author_id === options.userId : false;
    return mapQuestionRow(row, author, isOwner);
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    if (sort === 'latest') {
      nextCursor = lastItem.created_at as string;
    } else {
      nextCursor = `${lastItem.thought_count}_${lastItem.id}`;
    }
  }

  return { questions, nextCursor, hasMore };
}

/**
 * Get a single question by ID with author info.
 */
export async function getQuestionById(
  id: string,
  userId?: string
): Promise<QuestionWithAuthor | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('community_questions')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !row) {
    return null;
  }

  const profileMap = await fetchAuthorProfiles([row.author_id as string]);
  const author = getAuthorFromMap(profileMap, row.author_id as string);
  const isOwner = userId ? row.author_id === userId : false;

  return mapQuestionRow(row, author, isOwner);
}

/**
 * Create a new question.
 * Strips HTML from content and hashtags; normalizes hashtags
 * (lowercase, remove # prefix, deduplicate, max 5 tags, max 20 chars each).
 */
export async function createQuestion(
  authorId: string,
  content: string,
  hashtags: string[]
): Promise<QuestionWithAuthor> {
  const supabase = getSupabase();

  // Sanitize content
  const cleanContent = stripHtml(content);
  if (!cleanContent) {
    throw new Error('Content must not be empty after sanitization');
  }

  // Clean hashtags: strip HTML, lowercase, remove # prefix, deduplicate, max 5, max 20 chars
  const seen = new Set<string>();
  const cleanHashtags: string[] = [];
  for (const tag of hashtags) {
    const cleaned = stripHtml(tag)
      .toLowerCase()
      .replace(/^#/, '')
      .trim();
    if (cleaned && cleaned.length <= 20 && !seen.has(cleaned)) {
      seen.add(cleaned);
      cleanHashtags.push(cleaned);
      if (cleanHashtags.length >= 5) break;
    }
  }

  const { data: row, error } = await supabase
    .from('community_questions')
    .insert({
      author_id: authorId,
      content: cleanContent,
      hashtags: cleanHashtags,
    })
    .select('*')
    .single();

  if (error || !row) {
    throw new Error(`Failed to create question: ${error?.message || 'Unknown error'}`);
  }

  const profileMap = await fetchAuthorProfiles([authorId]);
  const author = getAuthorFromMap(profileMap, authorId);

  return mapQuestionRow(row, author, true);
}

/**
 * Delete a question. Verifies ownership (author_id === userId) before deleting.
 * @returns true if successfully deleted, false if not found or not owned.
 */
export async function deleteQuestion(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('community_questions')
    .select('author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return false;
  }

  if (existing.author_id !== userId) {
    return false;
  }

  const { error: deleteError } = await supabase
    .from('community_questions')
    .delete()
    .eq('id', id)
    .eq('author_id', userId);

  return !deleteError;
}

// ---------------------------------------------------------------------------
// Thoughts
// ---------------------------------------------------------------------------

/**
 * Get thoughts for a question with cursor-based pagination.
 *
 * Cursor strategy matches getQuestions:
 *  - 'latest' sort:  cursor = ISO timestamp (created_at), ordered DESC
 *  - 'popular' sort: cursor = "{like_count}_{id}", ordered by like_count DESC, created_at DESC
 *
 * Also checks if the requesting user has liked each thought.
 */
export async function getThoughts(
  questionId: string,
  options: {
    cursor?: string;
    limit?: number;
    sort?: 'latest' | 'popular';
    userId?: string;
  }
): Promise<{ thoughts: ThoughtWithAuthor[]; nextCursor: string | null; hasMore: boolean }> {
  const supabase = getSupabase();
  const limit = options.limit ?? 20;
  const sort = options.sort ?? 'latest';
  const fetchCount = limit + 1;

  let query = supabase
    .from('community_thoughts')
    .select('*')
    .eq('question_id', questionId)
    .eq('is_active', true);

  if (sort === 'latest') {
    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }
    query = query.order('created_at', { ascending: false });
  } else {
    // 'popular' sort by like_count DESC, created_at DESC
    if (options.cursor) {
      const separatorIndex = options.cursor.indexOf('_');
      if (separatorIndex !== -1) {
        const cursorCount = parseInt(options.cursor.substring(0, separatorIndex), 10);
        const cursorId = options.cursor.substring(separatorIndex + 1);

        query = query.or(
          `like_count.lt.${cursorCount},and(like_count.eq.${cursorCount},id.lt.${cursorId})`
        );
      }
    }
    query = query
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false });
  }

  query = query.limit(fetchCount);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { thoughts: [], nextCursor: null, hasMore: false };
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Batch-fetch author profiles
  const authorIds = items.map((r) => r.author_id as string);
  const profileMap = await fetchAuthorProfiles(authorIds);

  // Batch-check which thoughts the user has liked
  const likedSet = new Set<string>();
  if (options.userId && items.length > 0) {
    const thoughtIds = items.map((r) => r.id as string);
    const { data: likeRows } = await supabase
      .from('thought_likes')
      .select('thought_id')
      .eq('user_id', options.userId)
      .in('thought_id', thoughtIds);

    if (likeRows) {
      for (const lr of likeRows) {
        likedSet.add(lr.thought_id as string);
      }
    }
  }

  const thoughts: ThoughtWithAuthor[] = items.map((row) => {
    const author = getAuthorFromMap(profileMap, row.author_id as string);
    const isOwner = options.userId ? row.author_id === options.userId : false;
    const isLiked = likedSet.has(row.id as string);
    return mapThoughtRow(row, author, isOwner, isLiked);
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    if (sort === 'latest') {
      nextCursor = lastItem.created_at as string;
    } else {
      nextCursor = `${lastItem.like_count}_${lastItem.id}`;
    }
  }

  return { thoughts, nextCursor, hasMore };
}

/**
 * Create a new thought on a question.
 * Strips HTML from content. The database trigger automatically increments the parent question's thought_count.
 */
export async function createThought(
  questionId: string,
  authorId: string,
  content: string
): Promise<ThoughtWithAuthor> {
  const supabase = getSupabase();

  const cleanContent = stripHtml(content);
  if (!cleanContent) {
    throw new Error('Content must not be empty after sanitization');
  }

  // Verify question exists and is active
  const { data: question, error: questionError } = await supabase
    .from('community_questions')
    .select('id')
    .eq('id', questionId)
    .eq('is_active', true)
    .single();

  if (questionError || !question) {
    throw new Error('Question not found or is inactive');
  }

  // Insert thought
  const { data: row, error } = await supabase
    .from('community_thoughts')
    .insert({
      question_id: questionId,
      author_id: authorId,
      content: cleanContent,
    })
    .select('*')
    .single();

  if (error || !row) {
    throw new Error(`Failed to create thought: ${error?.message || 'Unknown error'}`);
  }

  // Note: The database trigger (trigger_update_thought_count) automatically
  // increments community_questions.thought_count when a thought is inserted.
  // We do not need to manually update it here.

  const profileMap = await fetchAuthorProfiles([authorId]);
  const author = getAuthorFromMap(profileMap, authorId);

  return mapThoughtRow(row, author, true, false);
}

/**
 * Delete a thought. Verifies ownership (author_id === userId) before deleting.
 * The database trigger automatically decrements the parent question's thought_count.
 * @returns true if successfully deleted, false if not found or not owned.
 */
export async function deleteThought(thoughtId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();

  // Verify ownership before deleting
  const { data: existing, error: fetchError } = await supabase
    .from('community_thoughts')
    .select('author_id')
    .eq('id', thoughtId)
    .single();

  if (fetchError || !existing) {
    return false;
  }

  if (existing.author_id !== userId) {
    return false;
  }

  const { error: deleteError } = await supabase
    .from('community_thoughts')
    .delete()
    .eq('id', thoughtId)
    .eq('author_id', userId);

  if (deleteError) {
    return false;
  }

  // Note: The database trigger (trigger_update_thought_count) automatically
  // decrements community_questions.thought_count when a thought is deleted.
  // We do not need to manually update it here.

  return true;
}

// ---------------------------------------------------------------------------
// Thought Likes
// ---------------------------------------------------------------------------

/**
 * Toggle like on a thought. If already liked, removes the like; otherwise adds one.
 * The database trigger automatically updates community_thoughts.like_count.
 * @returns the new like state and like count.
 */
export async function toggleThoughtLike(
  thoughtId: string,
  userId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const supabase = getSupabase();

  // Check if like exists
  const { data: existingLike } = await supabase
    .from('thought_likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('thought_id', thoughtId)
    .maybeSingle();

  let liked: boolean;

  if (existingLike) {
    // Unlike: remove the like
    await supabase
      .from('thought_likes')
      .delete()
      .eq('user_id', userId)
      .eq('thought_id', thoughtId);
    liked = false;
  } else {
    // Like: insert new like
    await supabase
      .from('thought_likes')
      .insert({ user_id: userId, thought_id: thoughtId });
    liked = true;
  }

  // Fetch the updated like_count from the database
  // The trigger (trigger_update_thought_like_count) has already updated it,
  // but we need to return the current value to the client
  const { data: thought } = await supabase
    .from('community_thoughts')
    .select('like_count')
    .eq('id', thoughtId)
    .single();

  const likeCount = (thought?.like_count as number) ?? 0;

  return { liked, likeCount };
}

// ---------------------------------------------------------------------------
// Admin Functions
// ---------------------------------------------------------------------------

/**
 * Admin: Get all questions (including inactive) with offset-based pagination.
 * Supports search by content and filtering by active status.
 */
export async function getAdminQuestions(options: {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}): Promise<{ questions: QuestionWithAuthor[]; total: number }> {
  const supabase = getSupabase();
  const page = options.page ?? 0;
  const limit = options.limit ?? 20;
  const includeInactive = options.includeInactive ?? true;
  const offset = page * limit;

  // Build count query
  let countQuery = supabase
    .from('community_questions')
    .select('*', { count: 'exact', head: true });

  if (!includeInactive) {
    countQuery = countQuery.eq('is_active', true);
  }

  if (options.search) {
    countQuery = countQuery.ilike('content', `%${options.search}%`);
  }

  const { count } = await countQuery;
  const total = count ?? 0;

  // Build data query
  let dataQuery = supabase
    .from('community_questions')
    .select('*');

  if (!includeInactive) {
    dataQuery = dataQuery.eq('is_active', true);
  }

  if (options.search) {
    dataQuery = dataQuery.ilike('content', `%${options.search}%`);
  }

  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: rows, error } = await dataQuery;

  if (error || !rows) {
    return { questions: [], total: 0 };
  }

  // Batch-fetch author profiles
  const authorIds = rows.map((r) => r.author_id as string);
  const profileMap = await fetchAuthorProfiles(authorIds);

  const questions: QuestionWithAuthor[] = rows.map((row) => {
    const author = getAuthorFromMap(profileMap, row.author_id as string);
    return mapQuestionRow(row, author, false);
  });

  return { questions, total };
}

/**
 * Admin: Create a question without rate limiting.
 * Reuses existing sanitization logic for content and hashtags.
 */
export async function adminCreateQuestion(
  content: string,
  hashtags: string[],
  authorId: string
): Promise<QuestionWithAuthor> {
  const supabase = getSupabase();

  // Sanitize content
  const cleanContent = stripHtml(content);
  if (!cleanContent) {
    throw new Error('Content must not be empty after sanitization');
  }

  // Clean hashtags: strip HTML, lowercase, remove # prefix, deduplicate, max 5, max 20 chars
  const seen = new Set<string>();
  const cleanHashtags: string[] = [];
  for (const tag of hashtags) {
    const cleaned = stripHtml(tag)
      .toLowerCase()
      .replace(/^#/, '')
      .trim();
    if (cleaned && cleaned.length <= 20 && !seen.has(cleaned)) {
      seen.add(cleaned);
      cleanHashtags.push(cleaned);
      if (cleanHashtags.length >= 5) break;
    }
  }

  const { data: row, error } = await supabase
    .from('community_questions')
    .insert({
      author_id: authorId,
      content: cleanContent,
      hashtags: cleanHashtags,
    })
    .select('*')
    .single();

  if (error || !row) {
    throw new Error(`Failed to create question: ${error?.message || 'Unknown error'}`);
  }

  const profileMap = await fetchAuthorProfiles([authorId]);
  const author = getAuthorFromMap(profileMap, authorId);

  return mapQuestionRow(row, author, false);
}

/**
 * Admin: Toggle question active status (is_active).
 * Returns the new active state.
 */
export async function adminToggleQuestionActive(id: string): Promise<{ isActive: boolean }> {
  const supabase = getSupabase();

  // Fetch current state
  const { data: existing, error: fetchError } = await supabase
    .from('community_questions')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw new Error('Question not found');
  }

  const newIsActive = !existing.is_active;

  const { error: updateError } = await supabase
    .from('community_questions')
    .update({ is_active: newIsActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to toggle question: ${updateError.message}`);
  }

  return { isActive: newIsActive };
}

/**
 * Admin: Hard delete a question and all related data.
 * Deletes thought_likes, community_thoughts, then the question itself.
 */
export async function adminDeleteQuestion(id: string): Promise<boolean> {
  const supabase = getSupabase();

  // First, get all thought IDs for this question to delete their likes
  const { data: thoughts } = await supabase
    .from('community_thoughts')
    .select('id')
    .eq('question_id', id);

  if (thoughts && thoughts.length > 0) {
    const thoughtIds = thoughts.map((t) => t.id as string);

    // Delete thought_likes for all thoughts of this question
    await supabase
      .from('thought_likes')
      .delete()
      .in('thought_id', thoughtIds);

    // Delete all thoughts for this question
    await supabase
      .from('community_thoughts')
      .delete()
      .eq('question_id', id);
  }

  // Delete the question itself
  const { error: deleteError } = await supabase
    .from('community_questions')
    .delete()
    .eq('id', id);

  return !deleteError;
}
