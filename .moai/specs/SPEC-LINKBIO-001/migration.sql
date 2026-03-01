-- SPEC-LINKBIO-001: Link-in-Bio Migration
-- Run manually in Supabase SQL Editor

-- 1. Create user_links table
CREATE TABLE user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_links_user_id ON user_links(user_id);

ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_links_select_public" ON user_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "user_links_insert_owner" ON user_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_links_update_owner" ON user_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_links_delete_owner" ON user_links
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Add social_links column to user_profiles
ALTER TABLE user_profiles ADD COLUMN social_links JSONB NOT NULL DEFAULT '[]';
