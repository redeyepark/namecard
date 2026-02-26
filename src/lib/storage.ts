import { getSupabase } from './supabase';
import type { CardRequest, RequestSummary, MemberRequestDetail, StatusHistoryEntry } from '@/types/request';
import type { CardTheme, PokemonMeta, PublicCardData, GalleryCardData, GalleryResponse } from '@/types/card';

/**
 * Convert base64 image data to Uint8Array for Supabase Storage upload.
 * Uses Uint8Array instead of Buffer for Cloudflare Workers compatibility.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryStr = atob(cleaned);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Save a card request to the database.
 * Inserts into card_requests and card_request_status_history tables.
 * Handles gracefully when is_public and event_id columns don't exist.
 */
export async function saveRequest(request: CardRequest): Promise<void> {
  const supabase = getSupabase();

  // Extract card front data without avatarImage (stored separately as URL)
  const { avatarImage: _avatarImage, ...cardFrontWithoutAvatar } = request.card.front;

  // Try insert with all columns
  const fullInsertData = {
    id: request.id,
    card_front: cardFrontWithoutAvatar,
    card_back: request.card.back,
    original_avatar_url: request.originalAvatarPath,
    illustration_url: request.illustrationPath,
    status: request.status,
    submitted_at: request.submittedAt,
    updated_at: request.updatedAt,
    note: request.note || null,
    created_by: request.createdBy || null,
    theme: request.card.theme || 'classic',
    pokemon_meta: request.card.pokemonMeta || null,
    is_public: false,
    event_id: request.eventId || null,
  };

  let insertError: any;

  // Try with all columns first
  const result = await supabase.from('card_requests').insert(fullInsertData);
  insertError = result.error;

  // If columns don't exist, retry without is_public and event_id
  if (insertError && (insertError.message?.includes('is_public') || insertError.message?.includes('event_id'))) {
    const { is_public: _is_public, event_id: _event_id, ...baseInsertData } = fullInsertData;

    const retryResult = await supabase.from('card_requests').insert(baseInsertData);
    insertError = retryResult.error;
  }

  if (insertError) {
    throw new Error(`Failed to save request: ${insertError.message}`);
  }

  // Insert initial status history entries
  if (request.statusHistory.length > 0) {
    const historyRows = request.statusHistory.map((entry) => ({
      request_id: request.id,
      status: entry.status,
      created_at: entry.timestamp,
      admin_feedback: entry.adminFeedback || null,
    }));

    const { error: historyError } = await supabase
      .from('card_request_status_history')
      .insert(historyRows);

    if (historyError) {
      throw new Error(`Failed to save status history: ${historyError.message}`);
    }
  }
}

/**
 * Get a single card request by ID.
 * Joins with status history table to reconstruct full CardRequest.
 * Handles gracefully when is_public and event_id columns don't exist.
 */
export async function getRequest(id: string): Promise<CardRequest | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('card_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) {
    return null;
  }

  // Fetch status history
  const { data: historyRows } = await supabase
    .from('card_request_status_history')
    .select('status, created_at, admin_feedback')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  const statusHistory: StatusHistoryEntry[] = (historyRows || []).map((h) => ({
    status: h.status,
    timestamp: h.created_at,
    adminFeedback: h.admin_feedback || undefined,
  }));

  // Reconstruct CardRequest from DB row
  // Handle missing columns gracefully - they may not exist in older DB versions
  const cardRequest: CardRequest = {
    id: row.id,
    card: {
      front: {
        ...row.card_front,
        avatarImage: null, // avatarImage is always null in stored card data
      },
      back: row.card_back,
      theme: (row.theme as CardTheme) || 'classic',
      pokemonMeta: (row.pokemon_meta as PokemonMeta) || undefined,
    },
    originalAvatarPath: row.original_avatar_url,
    illustrationPath: row.illustration_url,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    note: row.note || undefined,
    createdBy: row.created_by || undefined,
    isPublic: (row.is_public as boolean | undefined) ?? false, // Defaults to false if column doesn't exist
    eventId: (row.event_id as string | undefined) || undefined, // Defaults to undefined if column doesn't exist
    statusHistory,
  };

  return cardRequest;
}

/**
 * Dashboard statistics shape returned by getDashboardStats().
 */
export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byEvent: { eventId: string | null; eventName: string; count: number }[];
  byTheme: Record<string, number>;
  recentRequests: RequestSummary[];
}

/**
 * Get aggregated dashboard statistics for the admin dashboard.
 * Uses a single DB query for card_requests + one events query for names.
 * Handles gracefully when event_id column and events table don't exist.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();

  // Try to query with event_id first
  let { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, theme, event_id, illustration_url, original_avatar_url')
    .order('submitted_at', { ascending: false });

  // If event_id column doesn't exist, retry without it
  if (error && error.message?.includes('event_id')) {
    const retryResult = await supabase
      .from('card_requests')
      .select('id, card_front, status, submitted_at, theme, illustration_url, original_avatar_url')
      .order('submitted_at', { ascending: false });
    rows = (retryResult.data as any) || null; // Cast for compatibility
    error = retryResult.error;
  }

  if (error || !rows) {
    return {
      total: 0,
      byStatus: {},
      byEvent: [],
      byTheme: {},
      recentRequests: [],
    };
  }

  // Collect unique event IDs and fetch event names
  // Handle missing event_id column - cast to optional
  const eventIds = [...new Set(rows.map((r) => (r as any).event_id).filter(Boolean))] as string[];
  const eventNameMap = new Map<string, string>();

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .in('id', eventIds);

    if (events) {
      for (const e of events) {
        eventNameMap.set(e.id, e.name);
      }
    }
  }

  // Aggregate byStatus
  const byStatus: Record<string, number> = {};
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
  }

  // Aggregate byEvent
  const eventCountMap = new Map<string | null, number>();
  for (const row of rows) {
    const key = (row as any).event_id ?? null; // Handle missing event_id column
    eventCountMap.set(key, (eventCountMap.get(key) || 0) + 1);
  }

  const byEvent: DashboardStats['byEvent'] = [];
  for (const [eventId, count] of eventCountMap.entries()) {
    byEvent.push({
      eventId,
      eventName: eventId ? (eventNameMap.get(eventId) || '(Unknown)') : '미할당',
      count,
    });
  }
  // Sort by count descending
  byEvent.sort((a, b) => b.count - a.count);

  // Aggregate byTheme
  const byTheme: Record<string, number> = {};
  for (const row of rows) {
    const theme = row.theme || 'classic';
    byTheme[theme] = (byTheme[theme] || 0) + 1;
  }

  // Latest 5 requests as RequestSummary
  const recentRequests: RequestSummary[] = rows.slice(0, 5).map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    status: row.status,
    submittedAt: row.submitted_at,
    hasIllustration: row.illustration_url !== null,
    illustrationUrl: row.illustration_url || null,
    originalAvatarUrl: row.original_avatar_url || null,
    eventId: (row as any).event_id || null, // Handle missing event_id column
    eventName: (row as any).event_id ? (eventNameMap.get((row as any).event_id) || null) : null,
  }));

  return {
    total: rows.length,
    byStatus,
    byEvent,
    byTheme,
    recentRequests,
  };
}

/**
 * Get all requests as summaries, sorted by submittedAt descending.
 * Handles gracefully when event_id column and events table don't exist.
 */
export async function getAllRequests(): Promise<RequestSummary[]> {
  const supabase = getSupabase();

  // Try to query with event_id first
  let { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, illustration_url, original_avatar_url, event_id')
    .order('submitted_at', { ascending: false });

  // If event_id column doesn't exist, retry without it
  if (error && error.message?.includes('event_id')) {
    const retryResult = await supabase
      .from('card_requests')
      .select('id, card_front, status, submitted_at, illustration_url, original_avatar_url')
      .order('submitted_at', { ascending: false });
    rows = (retryResult.data as any) || null; // Cast for compatibility
    error = retryResult.error;
  }

  if (error || !rows) {
    return [];
  }

  // Collect unique event IDs and fetch event names
  // Handle missing event_id column - cast to optional
  const eventIds = [...new Set(rows.map((r) => (r as any).event_id).filter(Boolean))] as string[];
  const eventNameMap = new Map<string, string>();

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .in('id', eventIds);

    if (events) {
      for (const e of events) {
        eventNameMap.set(e.id, e.name);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    status: row.status,
    submittedAt: row.submitted_at,
    hasIllustration: row.illustration_url !== null,
    illustrationUrl: row.illustration_url || null,
    originalAvatarUrl: row.original_avatar_url || null,
    eventId: (row as any).event_id || null, // Handle missing event_id column
    eventName: (row as any).event_id ? (eventNameMap.get((row as any).event_id) || null) : null,
  }));
}

/**
 * Get all requests for a specific user, sorted by submittedAt descending.
 */
export async function getRequestsByUser(email: string): Promise<RequestSummary[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, illustration_url')
    .eq('created_by', email)
    .order('submitted_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  return rows.map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    status: row.status,
    submittedAt: row.submitted_at,
    hasIllustration: row.illustration_url !== null,
    illustrationUrl: row.illustration_url || null,
  }));
}

/**
 * Update a card request with partial data.
 * Optionally inserts a new status history entry if status changed.
 * Handles gracefully when is_public and event_id columns don't exist.
 */
export async function updateRequest(
  id: string,
  updates: Partial<CardRequest>
): Promise<CardRequest | null> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // Build the DB update object from CardRequest partial
  const dbUpdates: Record<string, unknown> = {
    updated_at: now,
  };

  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
  }
  if (updates.originalAvatarPath !== undefined) {
    dbUpdates.original_avatar_url = updates.originalAvatarPath;
  }
  if (updates.illustrationPath !== undefined) {
    dbUpdates.illustration_url = updates.illustrationPath;
  }
  if (updates.note !== undefined) {
    dbUpdates.note = updates.note;
  }
  if (updates.isPublic !== undefined) {
    dbUpdates.is_public = updates.isPublic;
  }
  if (updates.eventId !== undefined) {
    dbUpdates.event_id = updates.eventId || null;
  }
  if (updates.card) {
    if (updates.card.front) {
      const { avatarImage: _avatarImage, ...frontWithoutAvatar } = updates.card.front;
      dbUpdates.card_front = frontWithoutAvatar;
    }
    if (updates.card.back) {
      dbUpdates.card_back = updates.card.back;
    }
    if (updates.card.theme !== undefined) {
      dbUpdates.theme = updates.card.theme;
    }
    if (updates.card.pokemonMeta !== undefined) {
      dbUpdates.pokemon_meta = updates.card.pokemonMeta;
    }
  }

  let updateError: any;
  let result = await supabase
    .from('card_requests')
    .update(dbUpdates)
    .eq('id', id);
  updateError = result.error;

  // If is_public or event_id column doesn't exist, retry without them
  if (updateError && (updateError.message?.includes('is_public') || updateError.message?.includes('event_id'))) {
    const { is_public: _is_public, event_id: _event_id, ...baseUpdates } = dbUpdates;
    result = await supabase
      .from('card_requests')
      .update(baseUpdates)
      .eq('id', id);
    updateError = result.error;
  }

  if (updateError) {
    return null;
  }

  // Insert status history entry if status changed
  if (updates.statusHistory && updates.statusHistory.length > 0) {
    // Insert only the latest entry (the newly added one)
    const latestEntry = updates.statusHistory[updates.statusHistory.length - 1];
    await supabase.from('card_request_status_history').insert({
      request_id: id,
      status: latestEntry.status,
      created_at: latestEntry.timestamp,
      admin_feedback: latestEntry.adminFeedback || null,
    });
  }

  return getRequest(id);
}

/**
 * Upload an image file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 *
 * @param id - The request ID (used as folder name)
 * @param suffix - The image type ('avatar' or 'illustration')
 * @param base64Data - The base64-encoded image data (with or without data URL prefix)
 * @returns The public URL of the uploaded image
 */
export async function saveImageFile(
  id: string,
  suffix: string,
  base64Data: string
): Promise<string> {
  const supabase = getSupabase();
  const uint8Array = base64ToUint8Array(base64Data);
  const bucketName = suffix === 'avatar' ? 'avatars' : 'illustrations';
  const filePath = `${id}/${suffix}.png`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, uint8Array, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete a card request and its associated storage files.
 * Steps:
 * 1. Clear event_id to avoid FK RESTRICT violation (if column exists)
 * 2. Delete avatar and illustration files from Supabase Storage
 * 3. Delete the card_request record (status_history cascades automatically)
 */
export async function deleteRequest(id: string): Promise<boolean> {
  const supabase = getSupabase();

  // Step 1: Clear event_id to avoid FK RESTRICT violation (if column exists)
  const clearResult = await supabase
    .from('card_requests')
    .update({ event_id: null })
    .eq('id', id);

  // If event_id column doesn't exist, that's OK - just continue
  // Only log if there's a real error
  if (clearResult.error && !clearResult.error.message?.includes('event_id')) {
    console.warn(`Warning clearing event_id for ${id}:`, clearResult.error.message);
  }

  // Step 2: Delete storage files (ignore errors - files may not exist)
  await supabase.storage.from('avatars').remove([`${id}/avatar.png`]);
  await supabase.storage.from('illustrations').remove([`${id}/illustration.png`]);

  // Step 3: Delete the card_request record
  const { error } = await supabase
    .from('card_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Failed to delete request ${id}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Delete all card requests for a given user email.
 * Returns the count of deleted requests.
 */
export async function deleteRequestsByUser(email: string): Promise<number> {
  const supabase = getSupabase();

  // Find all requests by this user
  const { data: rows, error: fetchError } = await supabase
    .from('card_requests')
    .select('id')
    .eq('created_by', email);

  if (fetchError || !rows || rows.length === 0) {
    return 0;
  }

  let deletedCount = 0;
  for (const row of rows) {
    const success = await deleteRequest(row.id);
    if (success) {
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Get all unique members (created_by) with request counts and latest activity.
 */
export async function getAllMembers(): Promise<
  { email: string; requestCount: number; latestRequestDate: string }[]
> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('created_by, submitted_at')
    .not('created_by', 'is', null);

  if (error || !rows) {
    return [];
  }

  // Aggregate by email
  const memberMap = new Map<string, { count: number; latest: string }>();
  for (const row of rows) {
    const email = row.created_by as string;
    const existing = memberMap.get(email);
    if (existing) {
      existing.count++;
      if (row.submitted_at > existing.latest) {
        existing.latest = row.submitted_at;
      }
    } else {
      memberMap.set(email, { count: 1, latest: row.submitted_at });
    }
  }

  // Convert to array and sort by count DESC
  return Array.from(memberMap.entries())
    .map(([email, data]) => ({
      email,
      requestCount: data.count,
      latestRequestDate: data.latest,
    }))
    .sort((a, b) => b.requestCount - a.requestCount);
}

/**
 * Get all card requests for a specific member email.
 * Returns detailed request info including theme and event name.
 * Ordered by submitted_at DESC.
 * Handles gracefully when event_id column and events table don't exist.
 */
export async function getMemberRequests(email: string): Promise<MemberRequestDetail[]> {
  const supabase = getSupabase();

  // Try to query with event_id first
  let { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, theme, event_id, illustration_url, original_avatar_url')
    .eq('created_by', email)
    .order('submitted_at', { ascending: false });

  // If event_id column doesn't exist, retry without it
  if (error && error.message?.includes('event_id')) {
    const retryResult = await supabase
      .from('card_requests')
      .select('id, card_front, status, submitted_at, theme, illustration_url, original_avatar_url')
      .eq('created_by', email)
      .order('submitted_at', { ascending: false });
    rows = (retryResult.data as any) || null; // Cast for compatibility
    error = retryResult.error;
  }

  if (error || !rows) {
    return [];
  }

  // Collect unique event IDs and fetch event names
  // Handle missing event_id column - cast to optional
  const eventIds = [...new Set(rows.map((r) => (r as any).event_id).filter(Boolean))] as string[];
  const eventNameMap = new Map<string, string>();

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .in('id', eventIds);

    if (events) {
      for (const e of events) {
        eventNameMap.set(e.id, e.name);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    status: row.status,
    submittedAt: row.submitted_at,
    theme: row.theme || 'classic',
    eventName: (row as any).event_id ? (eventNameMap.get((row as any).event_id) || null) : null,
    illustrationUrl: row.illustration_url || null,
    originalAvatarUrl: row.original_avatar_url || null,
  }));
}

/**
 * Get all public cards with pagination and optional theme filter.
 * Only returns cards where is_public=true AND status is confirmed or delivered.
 * Excludes created_by (user email) for privacy.
 * Ordered by updated_at descending (newest first).
 * Returns empty if is_public column doesn't exist (public feature not available).
 */
export async function getPublicCards(
  page = 1,
  limit = 12,
  theme?: string
): Promise<{ cards: PublicCardData[]; total: number }> {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;
  let useIsPublic = true;

  // Build query for counting total
  let countQuery = supabase
    .from('card_requests')
    .select('id', { count: 'exact', head: true })
    .eq('is_public', true)
    .in('status', ['confirmed', 'delivered']);

  if (theme && theme !== 'all') {
    countQuery = countQuery.eq('theme', theme);
  }

  let { count, error: countError } = await countQuery;

  // If is_public column doesn't exist, fallback: count all confirmed/delivered cards
  if (countError && countError.message?.includes('is_public')) {
    useIsPublic = false;
    let fallbackCountQuery = supabase
      .from('card_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'delivered']);
    if (theme && theme !== 'all') {
      fallbackCountQuery = fallbackCountQuery.eq('theme', theme);
    }
    const retryCount = await fallbackCountQuery;
    count = retryCount.count;
    countError = retryCount.error;
  }

  if (countError) {
    return { cards: [], total: 0 };
  }

  // Build query for fetching cards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] | null = null;
  let dataError: { message?: string } | null = null;

  if (useIsPublic) {
    let dataQuery = supabase
      .from('card_requests')
      .select('id, card_front, card_back, original_avatar_url, illustration_url, theme, pokemon_meta, is_public, status')
      .eq('is_public', true)
      .in('status', ['confirmed', 'delivered'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (theme && theme !== 'all') {
      dataQuery = dataQuery.eq('theme', theme);
    }
    const result = await dataQuery;
    rows = result.data;
    dataError = result.error;
  } else {
    let dataQuery = supabase
      .from('card_requests')
      .select('id, card_front, card_back, original_avatar_url, illustration_url, theme, pokemon_meta, status')
      .in('status', ['confirmed', 'delivered'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (theme && theme !== 'all') {
      dataQuery = dataQuery.eq('theme', theme);
    }
    const result = await dataQuery;
    rows = result.data;
    dataError = result.error;
  }

  if (dataError || !rows) {
    return { cards: [], total: count ?? 0 };
  }

  const cards: PublicCardData[] = rows.map((row) => ({
    id: row.id,
    card: {
      front: {
        ...row.card_front,
        avatarImage: null,
      },
      back: row.card_back,
      theme: (row.theme as CardTheme) || 'classic',
      pokemonMeta: (row.pokemon_meta as PokemonMeta) || undefined,
    },
    originalAvatarUrl: row.original_avatar_url ?? null,
    illustrationUrl: row.illustration_url ?? null,
    theme: (row.theme as CardTheme) || 'classic',
  }));

  return { cards, total: count ?? 0 };
}

/**
 * Get a card by ID for direct URL access (e.g. QR code scan).
 * Returns any card regardless of status or is_public flag.
 * Direct URL access (QR scan) should always show the card.
 * Only cancelled/rejected cards are excluded.
 * Excludes created_by (user email) for privacy.
 */
export async function getPublicCard(id: string): Promise<PublicCardData | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('card_requests')
    .select('id, card_front, card_back, original_avatar_url, illustration_url, theme, pokemon_meta, status')
    .eq('id', id)
    .not('status', 'in', '("cancelled","rejected")')
    .single();

  if (error || !row) {
    return null;
  }

  return {
    id: row.id,
    card: {
      front: {
        ...row.card_front,
        avatarImage: null,
      },
      back: row.card_back,
      theme: (row.theme as CardTheme) || 'classic',
      pokemonMeta: (row.pokemon_meta as PokemonMeta) || undefined,
    },
    originalAvatarUrl: row.original_avatar_url ?? null,
    illustrationUrl: row.illustration_url ?? null,
    theme: (row.theme as CardTheme) || 'classic',
  };
}

/**
 * Get all gallery cards grouped by event.
 * Returns ALL cards except cancelled/rejected ones.
 * Cards are grouped by event_id with NULL events grouped as "미할당".
 * Events ordered by event_date DESC, then NULL events last.
 * Cards within each group ordered by submitted_at DESC.
 * Excludes created_by (user email) for privacy.
 * Handles gracefully when event_id column and events table don't exist.
 */
export async function getGalleryCards(): Promise<GalleryResponse> {
  const supabase = getSupabase();

  // Try to fetch all non-cancelled/rejected cards with event_id
  let { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, card_back, theme, illustration_url, original_avatar_url, status, submitted_at, event_id')
    .not('status', 'in', '("cancelled","rejected")')
    .order('submitted_at', { ascending: false });

  // If event_id column doesn't exist, retry without it
  if (error && error.message?.includes('event_id')) {
    const retryResult = await supabase
      .from('card_requests')
      .select('id, card_front, card_back, theme, illustration_url, original_avatar_url, status, submitted_at')
      .not('status', 'in', '("cancelled","rejected")')
      .order('submitted_at', { ascending: false });
    rows = (retryResult.data as any) || null; // Cast for compatibility
    error = retryResult.error;
  }

  if (error || !rows) {
    return { groups: [], totalCards: 0 };
  }

  // Collect unique event IDs and fetch event details
  // Handle missing event_id column - cast to optional
  const eventIds = [...new Set(rows.map((r) => (r as any).event_id).filter(Boolean))] as string[];
  const eventMap = new Map<string, { name: string; eventDate?: string }>();

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, name, event_date')
      .in('id', eventIds);

    if (events) {
      for (const e of events) {
        eventMap.set(e.id, {
          name: e.name,
          eventDate: e.event_date || undefined,
        });
      }
    }
  }

  // Map rows to GalleryCardData
  const mapRow = (row: typeof rows[number]): GalleryCardData => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    title: (row.card_back as { title?: string })?.title || '',
    theme: (row.theme as CardTheme) || 'classic',
    illustrationUrl: row.illustration_url ?? null,
    originalAvatarUrl: row.original_avatar_url ?? null,
    status: row.status,
  });

  // Group cards by event_id
  const groupMap = new Map<string | null, GalleryCardData[]>();

  for (const row of rows) {
    const key = (row as any).event_id ?? null; // Handle missing event_id column
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(mapRow(row));
  }

  // Build groups array: events with dates first (DESC), then events without dates, then NULL
  const eventGroups: GalleryResponse['groups'] = [];

  // Separate event groups by whether they have dates
  const withDate: { eventId: string; eventName: string; eventDate: string; cards: GalleryCardData[] }[] = [];
  const withoutDate: { eventId: string; eventName: string; cards: GalleryCardData[] }[] = [];

  for (const [eventId, cards] of groupMap.entries()) {
    if (eventId === null) continue; // Handle NULL group separately

    const eventInfo = eventMap.get(eventId);
    if (!eventInfo) continue;

    if (eventInfo.eventDate) {
      withDate.push({
        eventId,
        eventName: eventInfo.name,
        eventDate: eventInfo.eventDate,
        cards,
      });
    } else {
      withoutDate.push({
        eventId,
        eventName: eventInfo.name,
        cards,
      });
    }
  }

  // Sort events with dates by eventDate DESC
  withDate.sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  // Add dated events first
  for (const g of withDate) {
    eventGroups.push({
      eventId: g.eventId,
      eventName: g.eventName,
      eventDate: g.eventDate,
      cards: g.cards,
    });
  }

  // Add undated events
  for (const g of withoutDate) {
    eventGroups.push({
      eventId: g.eventId,
      eventName: g.eventName,
      cards: g.cards,
    });
  }

  // Add NULL event group last
  const nullCards = groupMap.get(null);
  if (nullCards && nullCards.length > 0) {
    eventGroups.push({
      eventId: null,
      eventName: '미할당',
      cards: nullCards,
    });
  }

  return {
    groups: eventGroups,
    totalCards: rows.length,
  };
}
