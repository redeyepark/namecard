-- SPEC-COMMUNITY-001: User Profiles + Community Feed
-- Run this migration in Supabase SQL Editor

-- 1. user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio VARCHAR(200) DEFAULT '',
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- 4. Extend card_requests
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 5. Backfill user_id from created_by email
UPDATE card_requests cr
SET user_id = au.id
FROM auth.users au
WHERE cr.created_by = au.email
  AND cr.user_id IS NULL;

-- 6. Indexes for feed performance
CREATE INDEX IF NOT EXISTS idx_card_requests_feed
  ON card_requests (is_public, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_requests_user
  ON card_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_card_requests_theme_feed
  ON card_requests (is_public, status, theme);

CREATE INDEX IF NOT EXISTS idx_card_requests_like_count
  ON card_requests (like_count DESC);
