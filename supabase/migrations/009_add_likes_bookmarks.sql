-- SPEC-COMMUNITY-002: Like + Bookmark System
-- Run this migration in Supabase SQL Editor

-- 1. card_likes table (composite PK for one-like-per-user-per-card)
CREATE TABLE card_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX idx_card_likes_card_id ON card_likes(card_id);

-- 2. card_bookmarks table (composite PK for one-bookmark-per-user-per-card)
CREATE TABLE card_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE INDEX idx_card_bookmarks_user_id ON card_bookmarks(user_id);

-- 3. RLS for card_likes (likes are public)
ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON card_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON card_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON card_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. RLS for card_bookmarks (bookmarks are private)
ALTER TABLE card_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON card_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark"
  ON card_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own bookmarks"
  ON card_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
