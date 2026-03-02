-- SPEC-COMMUNITY-003: Question & Thought Sharing
-- Creates community_questions, community_thoughts, thought_likes tables
-- with RLS policies and auto-update triggers for denormalized counts.

-- ============================================================
-- Table: community_questions
-- ============================================================
CREATE TABLE community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  thought_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_author ON community_questions(author_id);
CREATE INDEX idx_questions_created ON community_questions(created_at DESC);
CREATE INDEX idx_questions_active_created ON community_questions(is_active, created_at DESC);
CREATE INDEX idx_questions_hashtags ON community_questions USING GIN(hashtags);

ALTER TABLE community_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_public" ON community_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "questions_insert_auth" ON community_questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "questions_update_owner" ON community_questions
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "questions_delete_owner" ON community_questions
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- Table: community_thoughts
-- ============================================================
CREATE TABLE community_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_thoughts_question ON community_thoughts(question_id, created_at DESC);
CREATE INDEX idx_thoughts_author ON community_thoughts(author_id);

ALTER TABLE community_thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thoughts_select_public" ON community_thoughts
  FOR SELECT USING (is_active = true);

CREATE POLICY "thoughts_insert_auth" ON community_thoughts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "thoughts_update_owner" ON community_thoughts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "thoughts_delete_owner" ON community_thoughts
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- Table: thought_likes
-- ============================================================
CREATE TABLE thought_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES community_thoughts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, thought_id)
);

CREATE INDEX idx_thought_likes_thought ON thought_likes(thought_id);

ALTER TABLE thought_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thought_likes_select" ON thought_likes
  FOR SELECT USING (true);

CREATE POLICY "thought_likes_insert" ON thought_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "thought_likes_delete" ON thought_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-update community_questions.thought_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_question_thought_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions
    SET thought_count = thought_count + 1,
        updated_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions
    SET thought_count = GREATEST(thought_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thought_count
  AFTER INSERT OR DELETE ON community_thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_question_thought_count();

-- ============================================================
-- Trigger: auto-update community_thoughts.like_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_thought_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_thoughts
    SET like_count = like_count + 1
    WHERE id = NEW.thought_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_thoughts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.thought_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thought_like_count
  AFTER INSERT OR DELETE ON thought_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_thought_like_count();
