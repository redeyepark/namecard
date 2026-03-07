-- 014_add_surveys.sql

-- Survey table
CREATE TABLE community_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  select_mode TEXT NOT NULL DEFAULT 'single' CHECK (select_mode IN ('single', 'multi')),
  hashtags TEXT[] DEFAULT '{}',
  is_official BOOLEAN NOT NULL DEFAULT false,
  total_votes INTEGER NOT NULL DEFAULT 0,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Survey options table
CREATE TABLE survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES community_surveys(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes table
CREATE TABLE survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES community_surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES survey_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, option_id, voter_id)
);

-- Indexes
CREATE INDEX idx_surveys_author ON community_surveys(author_id);
CREATE INDEX idx_surveys_created_at ON community_surveys(created_at DESC);
CREATE INDEX idx_surveys_hashtags ON community_surveys USING GIN (hashtags);
CREATE INDEX idx_surveys_official ON community_surveys(is_official) WHERE is_official = true;
CREATE INDEX idx_survey_options_survey ON survey_options(survey_id, position);
CREATE INDEX idx_survey_votes_survey ON survey_votes(survey_id);
CREATE INDEX idx_survey_votes_voter ON survey_votes(voter_id, survey_id);

-- RLS policies
ALTER TABLE community_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surveys_select" ON community_surveys FOR SELECT USING (true);
CREATE POLICY "surveys_insert" ON community_surveys FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "surveys_delete" ON community_surveys FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "options_select" ON survey_options FOR SELECT USING (true);
CREATE POLICY "options_insert" ON survey_options FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM community_surveys WHERE id = survey_id AND author_id = auth.uid())
  );

CREATE POLICY "votes_select" ON survey_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON survey_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "votes_delete" ON survey_votes FOR DELETE
  USING (auth.uid() = voter_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_survey_updated_at
  BEFORE UPDATE ON community_surveys
  FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
