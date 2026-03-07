import { getSupabase } from './supabase';
import { stripHtml } from './question-storage';
import type {
  Survey,
  SurveyDetail,
  SurveyOption,
  CreateSurveyInput,
  SurveyListResponse,
} from '@/types/survey';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Check if a survey is closed based on closes_at timestamp.
 */
function isSurveyClosed(closesAt: string | null): boolean {
  if (!closesAt) return false;
  return new Date(closesAt) <= new Date();
}

/**
 * Map a snake_case community_surveys DB row to a camelCase Survey object.
 */
function mapSurveyRow(
  row: Record<string, unknown>,
  author: { id: string; displayName: string; avatarUrl: string | null },
  options: SurveyOption[],
  closed: boolean,
  userVotes?: string[]
): Survey | SurveyDetail {
  const base: Survey = {
    id: row.id as string,
    authorId: row.author_id as string,
    question: row.question as string,
    selectMode: row.select_mode as 'single' | 'multi',
    hashtags: (row.hashtags as string[]) || [],
    isOfficial: row.is_official as boolean,
    totalVotes: (row.total_votes as number) ?? 0,
    closesAt: (row.closes_at as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author,
    options,
    isClosed: closed,
  };

  if (userVotes !== undefined) {
    return {
      ...base,
      userVotes,
      hasVoted: userVotes.length > 0,
    } as SurveyDetail;
  }

  return base;
}

/**
 * Map snake_case survey_options rows to camelCase SurveyOption[].
 */
function mapOptionRows(rows: Record<string, unknown>[]): SurveyOption[] {
  return rows.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    position: (row.position as number) ?? 0,
    voteCount: (row.vote_count as number) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Rate Limiting (DB-based, Cloudflare Workers compatible)
// ---------------------------------------------------------------------------

/**
 * Check if user is rate limited for creating surveys.
 * Limit: max 1 survey per 5 minutes.
 * @returns true if rate limited (should NOT proceed)
 */
export async function checkSurveyRateLimit(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('community_surveys')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)
    .gte('created_at', fiveMinutesAgo);

  return count !== null && count >= 1;
}

// ---------------------------------------------------------------------------
// Surveys
// ---------------------------------------------------------------------------

/**
 * Get surveys with cursor-based pagination and optional filters.
 *
 * Cursor strategy:
 *  - 'latest' sort:  cursor = ISO timestamp (created_at), ordered DESC
 *  - 'popular' sort: cursor = "{total_votes}_{id}", ordered by total_votes DESC, created_at DESC
 *
 * Fetches limit+1 rows to determine hasMore, then returns at most `limit` items.
 * Official surveys (is_official=true) are returned separately for pinning.
 */
export async function getSurveys(options: {
  cursor?: string;
  limit?: number;
  sort?: 'latest' | 'popular';
  tag?: string;
  userId?: string;
}): Promise<SurveyListResponse & { official: Survey[] }> {
  const supabase = getSupabase();
  const limit = options.limit ?? 20;
  const sort = options.sort ?? 'latest';
  const fetchCount = limit + 1;

  // Fetch official surveys separately (for pinning)
  let officialQuery = supabase
    .from('community_surveys')
    .select('*')
    .eq('is_official', true);

  if (options.tag) {
    officialQuery = officialQuery.contains('hashtags', [options.tag]);
  }

  officialQuery = officialQuery.order('created_at', { ascending: false });

  const { data: officialRows } = await officialQuery;

  // Fetch regular surveys (non-official)
  let query = supabase
    .from('community_surveys')
    .select('*')
    .eq('is_official', false);

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
    // 'popular' sort: order by total_votes DESC, then created_at DESC
    if (options.cursor) {
      // cursor format: "{total_votes}_{id}"
      const separatorIndex = options.cursor.indexOf('_');
      if (separatorIndex !== -1) {
        const cursorCount = parseInt(options.cursor.substring(0, separatorIndex), 10);
        const cursorId = options.cursor.substring(separatorIndex + 1);

        query = query.or(
          `total_votes.lt.${cursorCount},and(total_votes.eq.${cursorCount},id.lt.${cursorId})`
        );
      }
    }
    query = query
      .order('total_votes', { ascending: false })
      .order('created_at', { ascending: false });
  }

  query = query.limit(fetchCount);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { data: [], nextCursor: null, hasMore: false, official: [] };
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Combine all survey IDs for options fetch
  const allSurveyRows = [...(officialRows || []), ...items];
  const allSurveyIds = allSurveyRows.map((r) => r.id as string);

  // Batch-fetch author profiles
  const authorIds = allSurveyRows.map((r) => r.author_id as string);
  const profileMap = await fetchAuthorProfiles(authorIds);

  // Batch-fetch options for all surveys
  const optionsMap = new Map<string, SurveyOption[]>();
  if (allSurveyIds.length > 0) {
    const { data: optionRows } = await supabase
      .from('survey_options')
      .select('*')
      .in('survey_id', allSurveyIds)
      .order('position', { ascending: true });

    if (optionRows) {
      for (const opt of optionRows) {
        const surveyId = opt.survey_id as string;
        if (!optionsMap.has(surveyId)) {
          optionsMap.set(surveyId, []);
        }
        optionsMap.get(surveyId)!.push({
          id: opt.id as string,
          label: opt.label as string,
          position: (opt.position as number) ?? 0,
          voteCount: (opt.vote_count as number) ?? 0,
        });
      }
    }
  }

  // Map official surveys
  const official: Survey[] = (officialRows || []).map((row) => {
    const author = getAuthorFromMap(profileMap, row.author_id as string);
    const surveyOptions = optionsMap.get(row.id as string) || [];
    const closed = isSurveyClosed(row.closes_at as string | null);
    return mapSurveyRow(row, author, surveyOptions, closed) as Survey;
  });

  // Map regular surveys
  const data: Survey[] = items.map((row) => {
    const author = getAuthorFromMap(profileMap, row.author_id as string);
    const surveyOptions = optionsMap.get(row.id as string) || [];
    const closed = isSurveyClosed(row.closes_at as string | null);
    return mapSurveyRow(row, author, surveyOptions, closed) as Survey;
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    if (sort === 'latest') {
      nextCursor = lastItem.created_at as string;
    } else {
      nextCursor = `${lastItem.total_votes}_${lastItem.id}`;
    }
  }

  return { data, nextCursor, hasMore, official };
}

/**
 * Get a single survey by ID with options and optionally the user's votes.
 */
export async function getSurveyById(
  id: string,
  userId?: string
): Promise<SurveyDetail | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('community_surveys')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) {
    return null;
  }

  // Fetch options
  const { data: optionRows } = await supabase
    .from('survey_options')
    .select('*')
    .eq('survey_id', id)
    .order('position', { ascending: true });

  const surveyOptions = optionRows ? mapOptionRows(optionRows) : [];

  // Fetch user's votes
  let userVotes: string[] = [];
  if (userId) {
    const { data: voteRows } = await supabase
      .from('survey_votes')
      .select('option_id')
      .eq('survey_id', id)
      .eq('voter_id', userId);

    if (voteRows) {
      userVotes = voteRows.map((v) => v.option_id as string);
    }
  }

  const profileMap = await fetchAuthorProfiles([row.author_id as string]);
  const author = getAuthorFromMap(profileMap, row.author_id as string);
  const closed = isSurveyClosed(row.closes_at as string | null);

  return mapSurveyRow(row, author, surveyOptions, closed, userVotes) as SurveyDetail;
}

// ---------------------------------------------------------------------------
// Create / Delete
// ---------------------------------------------------------------------------

/**
 * Create a new survey with options.
 * Strips HTML from question and option labels; normalizes hashtags.
 */
export async function createSurvey(
  authorId: string,
  input: CreateSurveyInput
): Promise<SurveyDetail> {
  const supabase = getSupabase();

  // Sanitize question
  const cleanQuestion = stripHtml(input.question);
  if (!cleanQuestion) {
    throw new Error('Question must not be empty after sanitization');
  }

  // Validate options
  if (!input.options || input.options.length < 2) {
    throw new Error('At least 2 options are required');
  }

  // Clean option labels
  const cleanOptions = input.options
    .map((opt) => stripHtml(opt))
    .filter((opt) => opt.length > 0);

  if (cleanOptions.length < 2) {
    throw new Error('At least 2 valid options are required after sanitization');
  }

  // Clean hashtags: strip HTML, lowercase, remove # prefix, deduplicate, max 5, max 20 chars
  const cleanHashtags: string[] = [];
  if (input.hashtags) {
    const seen = new Set<string>();
    for (const tag of input.hashtags) {
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
  }

  // Insert survey
  const { data: surveyRow, error: surveyError } = await supabase
    .from('community_surveys')
    .insert({
      author_id: authorId,
      question: cleanQuestion,
      select_mode: input.selectMode,
      hashtags: cleanHashtags,
      closes_at: input.closesAt || null,
    })
    .select('*')
    .single();

  if (surveyError || !surveyRow) {
    throw new Error(`Failed to create survey: ${surveyError?.message || 'Unknown error'}`);
  }

  const surveyId = surveyRow.id as string;

  // Insert options sequentially
  const insertedOptions: SurveyOption[] = [];
  for (let i = 0; i < cleanOptions.length; i++) {
    const { data: optRow, error: optError } = await supabase
      .from('survey_options')
      .insert({
        survey_id: surveyId,
        label: cleanOptions[i],
        position: i,
      })
      .select('*')
      .single();

    if (optError || !optRow) {
      throw new Error(`Failed to create survey option: ${optError?.message || 'Unknown error'}`);
    }

    insertedOptions.push({
      id: optRow.id as string,
      label: optRow.label as string,
      position: (optRow.position as number) ?? 0,
      voteCount: 0,
    });
  }

  const profileMap = await fetchAuthorProfiles([authorId]);
  const author = getAuthorFromMap(profileMap, authorId);
  const closed = isSurveyClosed(surveyRow.closes_at as string | null);

  return mapSurveyRow(surveyRow, author, insertedOptions, closed, []) as SurveyDetail;
}

/**
 * Delete a survey. Verifies ownership (author_id === userId) before deleting.
 * @returns true if successfully deleted, false if not found or not owned.
 */
export async function deleteSurvey(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('community_surveys')
    .select('author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return false;
  }

  if (existing.author_id !== userId) {
    return false;
  }

  // CASCADE will handle survey_options and survey_votes
  const { error: deleteError } = await supabase
    .from('community_surveys')
    .delete()
    .eq('id', id)
    .eq('author_id', userId);

  return !deleteError;
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

/**
 * Vote on a survey. Handles both single and multi select modes.
 *
 * For single mode: exactly 1 optionId required; replaces existing vote.
 * For multi mode: at least 1 optionId required; replaces all existing votes.
 *
 * Updates vote_count on each option using COUNT and total_votes on the survey
 * using COUNT of distinct voters.
 *
 * @returns updated SurveyDetail
 */
export async function voteSurvey(
  surveyId: string,
  userId: string,
  optionIds: string[],
  selectMode: 'single' | 'multi'
): Promise<SurveyDetail> {
  const supabase = getSupabase();

  // 1. Verify survey exists
  const { data: survey, error: surveyError } = await supabase
    .from('community_surveys')
    .select('*')
    .eq('id', surveyId)
    .single();

  if (surveyError || !survey) {
    throw new Error('Survey not found');
  }

  // 2. Check if closed
  if (isSurveyClosed(survey.closes_at as string | null)) {
    throw new Error('Survey is closed');
  }

  // 3. Validate optionIds count
  if (selectMode === 'single' && optionIds.length !== 1) {
    throw new Error('Single select mode requires exactly 1 option');
  }
  if (optionIds.length < 1) {
    throw new Error('At least 1 option is required');
  }

  // 4. Verify all optionIds belong to this survey
  const { data: validOptions } = await supabase
    .from('survey_options')
    .select('id')
    .eq('survey_id', surveyId)
    .in('id', optionIds);

  if (!validOptions || validOptions.length !== optionIds.length) {
    throw new Error('One or more option IDs are invalid for this survey');
  }

  // 5. Delete existing votes for this user+survey
  await supabase
    .from('survey_votes')
    .delete()
    .eq('survey_id', surveyId)
    .eq('voter_id', userId);

  // 6. Insert new votes
  const voteInserts = optionIds.map((optionId) => ({
    survey_id: surveyId,
    option_id: optionId,
    voter_id: userId,
  }));

  const { error: voteError } = await supabase
    .from('survey_votes')
    .insert(voteInserts);

  if (voteError) {
    throw new Error(`Failed to cast vote: ${voteError.message}`);
  }

  // 7. Update each option's vote_count using COUNT
  const { data: allOptions } = await supabase
    .from('survey_options')
    .select('id')
    .eq('survey_id', surveyId);

  if (allOptions) {
    for (const opt of allOptions) {
      const optId = opt.id as string;
      const { count: voteCount } = await supabase
        .from('survey_votes')
        .select('*', { count: 'exact', head: true })
        .eq('option_id', optId);

      await supabase
        .from('survey_options')
        .update({ vote_count: voteCount ?? 0 })
        .eq('id', optId);
    }
  }

  // 8. Update survey's total_votes using COUNT of distinct voters
  const { data: distinctVoters } = await supabase
    .from('survey_votes')
    .select('voter_id')
    .eq('survey_id', surveyId);

  const uniqueVoterCount = distinctVoters
    ? new Set(distinctVoters.map((v) => v.voter_id as string)).size
    : 0;

  await supabase
    .from('community_surveys')
    .update({ total_votes: uniqueVoterCount, updated_at: new Date().toISOString() })
    .eq('id', surveyId);

  // 9. Return updated SurveyDetail
  return (await getSurveyById(surveyId, userId))!;
}
