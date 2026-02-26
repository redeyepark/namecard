-- Add public/private visibility toggle for card requests
-- Default is private (false). Only confirmed/delivered cards can be made public.
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index for efficient lookup of public cards
CREATE INDEX IF NOT EXISTS idx_card_requests_is_public
  ON card_requests (is_public) WHERE is_public = TRUE;

-- Composite partial index for public card queries filtered by status
CREATE INDEX IF NOT EXISTS idx_card_requests_public_status
  ON card_requests (is_public, status)
  WHERE is_public = TRUE AND status IN ('confirmed', 'delivered');
