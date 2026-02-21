-- card_requests table
CREATE TABLE card_requests (
  id UUID PRIMARY KEY,
  card_front JSONB NOT NULL,      -- CardFrontData (without avatarImage)
  card_back JSONB NOT NULL,       -- CardBackData
  original_avatar_url TEXT,        -- Supabase Storage public URL
  illustration_url TEXT,           -- Supabase Storage public URL
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'confirmed')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_by TEXT                  -- User email from NextAuth
);

-- status history table
CREATE TABLE card_request_status_history (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'processing', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_card_requests_status ON card_requests(status);
CREATE INDEX idx_card_requests_submitted_at ON card_requests(submitted_at DESC);
CREATE INDEX idx_status_history_request_id ON card_request_status_history(request_id);

-- Disable RLS (we use NextAuth for auth, not Supabase Auth)
ALTER TABLE card_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON card_requests FOR ALL USING (true);

ALTER TABLE card_request_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON card_request_status_history FOR ALL USING (true);
