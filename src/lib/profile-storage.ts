import { getSupabase } from './supabase';
import type { UserProfile, ProfilePageData } from '@/types/profile';
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
  data: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl' | 'isPublic'>>
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
    .select('id, card_front, card_back, theme, illustration_url, original_avatar_url, status')
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
