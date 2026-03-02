-- ============================================================================
-- Migration 012: Coffee Chat Requests
-- SPEC-COMMUNITY-004: Coffee chat request/accept matching system
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table: coffee_chat_requests
-- ---------------------------------------------------------------------------
CREATE TABLE coffee_chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response_message TEXT,
  meeting_preference VARCHAR(20) NOT NULL DEFAULT 'any',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requester_read BOOLEAN NOT NULL DEFAULT true,
  receiver_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_meeting_preference CHECK (meeting_preference IN ('online', 'offline', 'any')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  CONSTRAINT chk_not_self CHECK (requester_id != receiver_id)
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_coffee_chat_requester ON coffee_chat_requests(requester_id, status);
CREATE INDEX idx_coffee_chat_receiver ON coffee_chat_requests(receiver_id, status);
CREATE INDEX idx_coffee_chat_created ON coffee_chat_requests(created_at DESC);

-- Unique constraint: only one active (pending/accepted) request between two users
-- Uses LEAST/GREATEST to treat A->B and B->A as the same pair
CREATE UNIQUE INDEX idx_coffee_chat_active_pair ON coffee_chat_requests(
  LEAST(requester_id, receiver_id),
  GREATEST(requester_id, receiver_id)
) WHERE status IN ('pending', 'accepted');

-- ---------------------------------------------------------------------------
-- 3. RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE coffee_chat_requests ENABLE ROW LEVEL SECURITY;

-- Only involved users can see their requests
CREATE POLICY "coffee_chat_select_involved" ON coffee_chat_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Authenticated users can create requests (must be the requester)
CREATE POLICY "coffee_chat_insert_auth" ON coffee_chat_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Involved users can update (status changes)
CREATE POLICY "coffee_chat_update_involved" ON coffee_chat_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- ---------------------------------------------------------------------------
-- 4. Auto-update updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_coffee_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coffee_chat_updated_at
  BEFORE UPDATE ON coffee_chat_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_coffee_chat_updated_at();
