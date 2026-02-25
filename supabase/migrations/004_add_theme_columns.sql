-- Add theme and pokemon_meta columns to card_requests
-- Supports 'classic' (default) and 'pokemon' card themes
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'classic';
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS pokemon_meta JSONB;
