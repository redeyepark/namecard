import { getSupabase } from './supabase';
import type { CardRequest, RequestSummary, StatusHistoryEntry } from '@/types/request';
import type { CardTheme, PokemonMeta, PublicCardData } from '@/types/card';

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
 */
export async function saveRequest(request: CardRequest): Promise<void> {
  const supabase = getSupabase();

  // Extract card front data without avatarImage (stored separately as URL)
  const { avatarImage: _avatarImage, ...cardFrontWithoutAvatar } = request.card.front;

  const { error: insertError } = await supabase.from('card_requests').insert({
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
  });

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
    isPublic: row.is_public ?? false,
    eventId: row.event_id || undefined,
    statusHistory,
  };

  return cardRequest;
}

/**
 * Get all requests as summaries, sorted by submittedAt descending.
 */
export async function getAllRequests(): Promise<RequestSummary[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, status, submitted_at, illustration_url, original_avatar_url, event_id')
    .order('submitted_at', { ascending: false });

  if (error || !rows) {
    return [];
  }

  // Collect unique event IDs and fetch event names
  const eventIds = [...new Set(rows.map((r) => r.event_id).filter(Boolean))] as string[];
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
    originalAvatarUrl: row.original_avatar_url || null,
    eventId: row.event_id || null,
    eventName: row.event_id ? (eventNameMap.get(row.event_id) || null) : null,
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
  }));
}

/**
 * Update a card request with partial data.
 * Optionally inserts a new status history entry if status changed.
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

  const { error: updateError } = await supabase
    .from('card_requests')
    .update(dbUpdates)
    .eq('id', id);

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
 * 1. Clear event_id to avoid FK RESTRICT violation
 * 2. Delete avatar and illustration files from Supabase Storage
 * 3. Delete the card_request record (status_history cascades automatically)
 */
export async function deleteRequest(id: string): Promise<boolean> {
  const supabase = getSupabase();

  // Step 1: Clear event_id to avoid FK RESTRICT violation
  await supabase
    .from('card_requests')
    .update({ event_id: null })
    .eq('id', id);

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
 * Get a public card by ID.
 * Only returns cards where is_public=true AND status is confirmed or delivered.
 * Excludes created_by (user email) for privacy.
 */
export async function getPublicCard(id: string): Promise<PublicCardData | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('card_requests')
    .select('id, card_front, card_back, original_avatar_url, illustration_url, theme, pokemon_meta, is_public, status')
    .eq('id', id)
    .eq('is_public', true)
    .in('status', ['confirmed', 'delivered'])
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
