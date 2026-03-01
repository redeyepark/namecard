import { getSupabase } from './supabase';
import type { UserProfile, ProfilePageData, UserLink, SocialLink } from '@/types/profile';
import type { GalleryCardData, CardTheme } from '@/types/card';

/**
 * Get user profile with card stats (card count, total likes, theme distribution).
 * Only counts public + confirmed/delivered cards for stats.
 */
export async function getProfile(userId: string): Promise<ProfilePageData | null> {
  const supabase = getSupabase();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Fetch card stats: count, total likes, theme distribution
  // Only count public + confirmed/delivered cards
  const { data: cards, error: cardsError } = await supabase
    .from('card_requests')
    .select('theme, like_count')
    .eq('user_id', userId)
    .eq('is_public', true)
    .in('status', ['confirmed', 'delivered']);

  let cardCount = 0;
  let totalLikes = 0;
  const themeCountMap = new Map<string, number>();

  if (!cardsError && cards) {
    cardCount = cards.length;
    for (const card of cards) {
      totalLikes += (card.like_count as number) || 0;
      const theme = (card.theme as string) || 'classic';
      themeCountMap.set(theme, (themeCountMap.get(theme) || 0) + 1);
    }
  }

  const themeDistribution = Array.from(themeCountMap.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);

  return {
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url || null,
      isPublic: profile.is_public ?? true,
      socialLinks: (profile.social_links as SocialLink[]) || [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    cardCount,
    totalLikes,
    themeDistribution,
  };
}

/**
 * Create profile (upsert pattern).
 * Uses INSERT with ON CONFLICT DO NOTHING so existing profiles are not overwritten.
 */
export async function createProfile(
  userId: string,
  data: { displayName: string; email?: string }
): Promise<UserProfile> {
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If profile already exists, return it
  if (!existingError && existing) {
    return {
      id: existing.id,
      displayName: existing.display_name,
      bio: existing.bio || '',
      avatarUrl: existing.avatar_url || null,
      isPublic: existing.is_public ?? true,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  // Create new profile
  const { data: created, error: createError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      display_name: data.displayName,
      bio: '',
      is_public: true,
    })
    .select()
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create profile: ${createError?.message || 'Unknown error'}`);
  }

  return {
    id: created.id,
    displayName: created.display_name,
    bio: created.bio || '',
    avatarUrl: created.avatar_url || null,
    isPublic: created.is_public ?? true,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  };
}

/**
 * Update profile fields.
 * Validates: displayName 1-100 chars, bio max 200 chars.
 */
export async function updateProfile(
  userId: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl' | 'isPublic'>> & {
    socialLinks?: SocialLink[];
  }
): Promise<UserProfile> {
  const supabase = getSupabase();

  // Validate inputs
  if (data.displayName !== undefined) {
    if (data.displayName.length < 1 || data.displayName.length > 100) {
      throw new Error('displayName must be between 1 and 100 characters');
    }
  }
  if (data.bio !== undefined) {
    if (data.bio.length > 200) {
      throw new Error('bio must be at most 200 characters');
    }
  }

  // Build DB update object
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.displayName !== undefined) {
    dbUpdates.display_name = data.displayName;
  }
  if (data.bio !== undefined) {
    dbUpdates.bio = data.bio;
  }
  if (data.avatarUrl !== undefined) {
    dbUpdates.avatar_url = data.avatarUrl;
  }
  if (data.isPublic !== undefined) {
    dbUpdates.is_public = data.isPublic;
  }
  if (data.socialLinks !== undefined) {
    dbUpdates.social_links = data.socialLinks;
  }

  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update profile: ${error?.message || 'Profile not found'}`);
  }

  return {
    id: updated.id,
    displayName: updated.display_name,
    bio: updated.bio || '',
    avatarUrl: updated.avatar_url || null,
    isPublic: updated.is_public ?? true,
    socialLinks: (updated.social_links as SocialLink[]) || [],
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

/**
 * Get user's public cards with pagination.
 * Only returns cards where is_public=true AND status is confirmed or delivered.
 * Ordered by submitted_at DESC.
 */
export async function getUserCards(
  userId: string,
  page = 1,
  limit = 12
): Promise<{ cards: GalleryCardData[]; total: number }> {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  // Count total
  const { count, error: countError } = await supabase
    .from('card_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true)
    .in('status', ['confirmed', 'delivered']);

  if (countError) {
    return { cards: [], total: 0 };
  }

  // Fetch cards
  const { data: rows, error } = await supabase
    .from('card_requests')
    .select('id, card_front, card_back, theme, illustration_url, original_avatar_url, status, like_count')
    .eq('user_id', userId)
    .eq('is_public', true)
    .in('status', ['confirmed', 'delivered'])
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !rows) {
    return { cards: [], total: count ?? 0 };
  }

  const cards: GalleryCardData[] = rows.map((row) => ({
    id: row.id,
    displayName: (row.card_front as { displayName?: string })?.displayName || '',
    title: (row.card_back as { title?: string })?.title || '',
    theme: (row.theme as CardTheme) || 'classic',
    illustrationUrl: row.illustration_url ?? null,
    originalAvatarUrl: row.original_avatar_url ?? null,
    status: row.status,
    likeCount: row.like_count ?? 0,
  }));

  return { cards, total: count ?? 0 };
}

/**
 * Ensure profile exists for a user. Creates one if missing.
 * Attempts to derive displayName from the user's latest card_request,
 * falling back to the email prefix.
 */
export async function ensureProfile(userId: string, email: string): Promise<UserProfile> {
  const supabase = getSupabase();

  // Check if profile already exists
  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!existingError && existing) {
    return {
      id: existing.id,
      displayName: existing.display_name,
      bio: existing.bio || '',
      avatarUrl: existing.avatar_url || null,
      isPublic: existing.is_public ?? true,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    };
  }

  // Try to find a displayName from the user's latest card_request
  let displayName = email.split('@')[0]; // fallback to email prefix

  const { data: latestCard } = await supabase
    .from('card_requests')
    .select('card_front')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  if (latestCard) {
    const cardDisplayName = (latestCard.card_front as { displayName?: string })?.displayName;
    if (cardDisplayName) {
      displayName = cardDisplayName;
    }
  } else {
    // Also try by email (created_by field) for cards without user_id
    const { data: emailCard } = await supabase
      .from('card_requests')
      .select('card_front')
      .eq('created_by', email)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (emailCard) {
      const cardDisplayName = (emailCard.card_front as { displayName?: string })?.displayName;
      if (cardDisplayName) {
        displayName = cardDisplayName;
      }
    }
  }

  return createProfile(userId, { displayName, email });
}

// ---------------------------------------------------------------------------
// User Links CRUD (SPEC-LINKBIO-001)
// ---------------------------------------------------------------------------

/**
 * Map a snake_case user_links DB row to a camelCase UserLink object.
 */
function mapUserLink(row: Record<string, unknown>): UserLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    url: row.url as string,
    icon: (row.icon as string) || null,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Get a user's public (active) links, ordered by sort_order ascending.
 * Used for public profile pages.
 */
export async function getUserLinks(userId: string): Promise<UserLink[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !rows) {
    return [];
  }

  return rows.map(mapUserLink);
}

/**
 * Get all of a user's links (including inactive), ordered by sort_order ascending.
 * Used for the owner's link management page.
 */
export async function getMyLinks(userId: string): Promise<UserLink[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error || !rows) {
    return [];
  }

  return rows.map(mapUserLink);
}

/**
 * Create a new user link. Automatically assigns the next sort_order.
 */
export async function createUserLink(
  userId: string,
  data: { title: string; url: string; icon?: string }
): Promise<UserLink> {
  const supabase = getSupabase();

  // Get the current max sort_order for this user
  const { data: maxRow } = await supabase
    .from('user_links')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0;

  const { data: created, error } = await supabase
    .from('user_links')
    .insert({
      user_id: userId,
      title: data.title,
      url: data.url,
      icon: data.icon || null,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to create link: ${error?.message || 'Unknown error'}`);
  }

  return mapUserLink(created);
}

/**
 * Update an existing user link. Only updates provided fields.
 * Verifies ownership by matching both linkId and userId.
 */
export async function updateUserLink(
  userId: string,
  linkId: string,
  data: { title?: string; url?: string; icon?: string; isActive?: boolean }
): Promise<UserLink> {
  const supabase = getSupabase();

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) {
    dbUpdates.title = data.title;
  }
  if (data.url !== undefined) {
    dbUpdates.url = data.url;
  }
  if (data.icon !== undefined) {
    dbUpdates.icon = data.icon;
  }
  if (data.isActive !== undefined) {
    dbUpdates.is_active = data.isActive;
  }

  const { data: updated, error } = await supabase
    .from('user_links')
    .update(dbUpdates)
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update link: ${error?.message || 'Link not found or access denied'}`);
  }

  return mapUserLink(updated);
}

/**
 * Delete a user link. Verifies ownership by matching both linkId and userId.
 */
export async function deleteUserLink(userId: string, linkId: string): Promise<void> {
  const supabase = getSupabase();

  const { error, count } = await supabase
    .from('user_links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete link: ${error.message}`);
  }

  // count can be null if count option was not set; check via a follow-up if needed
  if (count === 0) {
    throw new Error('Link not found or access denied');
  }
}

/**
 * Reorder user links by updating sort_order for each link.
 * linkIds array determines the new order (index = new sort_order).
 * Only updates links belonging to the specified user.
 */
export async function reorderUserLinks(userId: string, linkIds: string[]): Promise<void> {
  const supabase = getSupabase();

  // Update each link's sort_order based on its position in the array
  const updates = linkIds.map((linkId, index) =>
    supabase
      .from('user_links')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', linkId)
      .eq('user_id', userId)
  );

  const results = await Promise.all(updates);

  for (const result of results) {
    if (result.error) {
      throw new Error(`Failed to reorder links: ${result.error.message}`);
    }
  }
}
