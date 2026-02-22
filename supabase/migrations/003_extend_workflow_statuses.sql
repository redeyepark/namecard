-- Extend card_requests status CHECK constraint to 7 statuses
ALTER TABLE card_requests DROP CONSTRAINT IF EXISTS card_requests_status_check;
ALTER TABLE card_requests ADD CONSTRAINT card_requests_status_check
  CHECK (status IN ('submitted', 'processing', 'confirmed', 'revision_requested', 'rejected', 'delivered', 'cancelled'));

-- Extend card_request_status_history status CHECK constraint
ALTER TABLE card_request_status_history DROP CONSTRAINT IF EXISTS card_request_status_history_status_check;
ALTER TABLE card_request_status_history ADD CONSTRAINT card_request_status_history_status_check
  CHECK (status IN ('submitted', 'processing', 'confirmed', 'revision_requested', 'rejected', 'delivered', 'cancelled'));

-- Add admin_feedback column to status history
ALTER TABLE card_request_status_history ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
