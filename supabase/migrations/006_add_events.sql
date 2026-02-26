-- Event management system for tracking event participation
-- Events can be associated with card requests for participant tracking

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  event_date DATE,
  location TEXT CHECK (char_length(location) <= 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add event reference to card_requests
ALTER TABLE card_requests ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE RESTRICT;
CREATE INDEX idx_card_requests_event_id ON card_requests(event_id);

-- RLS policies for events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
