-- SPEC-PRINT-002: Gelato Print API Integration
-- M1: Database schema for print orders

-- 1. print_orders table
CREATE TABLE print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gelato_order_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'production', 'shipped', 'delivered', 'cancelled', 'failed')),
  order_type TEXT NOT NULL DEFAULT 'draft' CHECK (order_type IN ('draft', 'order')),
  shipping_address JSONB,
  shipping_method TEXT CHECK (shipping_method IN ('normal', 'express', 'overnight')),
  quote_amount DECIMAL,
  quote_currency TEXT,
  tracking_url TEXT,
  tracking_code TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. print_order_items table
CREATE TABLE print_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  card_request_id UUID NOT NULL REFERENCES card_requests(id),
  product_uid TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 100,
  front_pdf_url TEXT,
  back_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add print_status column to card_requests
ALTER TABLE card_requests ADD COLUMN print_status TEXT;

-- 4. Indexes
CREATE INDEX idx_print_orders_status ON print_orders(status);
CREATE INDEX idx_print_orders_created_at ON print_orders(created_at DESC);
CREATE INDEX idx_print_order_items_print_order_id ON print_order_items(print_order_id);
CREATE INDEX idx_print_order_items_card_request_id ON print_order_items(card_request_id);

-- 5. RLS: Enable + Allow all for service role (matching existing pattern)
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON print_orders FOR ALL USING (true);

ALTER TABLE print_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON print_order_items FOR ALL USING (true);

-- 6. Trigger: auto-update updated_at on print_orders
CREATE OR REPLACE FUNCTION update_print_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_print_orders_updated_at
  BEFORE UPDATE ON print_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_print_orders_updated_at();

-- 7. Storage bucket for print PDFs
-- NOTE: Supabase storage buckets are managed via the Supabase Dashboard or API.
-- Create a 'print-pdfs' bucket manually in the Supabase Dashboard:
--   Storage > New Bucket > Name: "print-pdfs" > Public: false
-- Alternatively, use the Supabase client:
--   supabase.storage.createBucket('print-pdfs', { public: false })
