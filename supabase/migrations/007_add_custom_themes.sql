-- Create custom_themes table
CREATE TABLE custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  base_template TEXT NOT NULL DEFAULT 'classic'
    CHECK (base_template IN ('classic', 'nametag')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  front_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  front_text_color TEXT NOT NULL DEFAULT '#000000',
  front_border_color TEXT NOT NULL DEFAULT '#020912',
  back_bg_color TEXT NOT NULL DEFAULT '#000000',
  back_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  back_border_color TEXT NOT NULL DEFAULT '#020912',
  accent_color TEXT NOT NULL DEFAULT '#020912',
  font_family TEXT NOT NULL DEFAULT 'Nanum Myeongjo',
  border_style TEXT NOT NULL DEFAULT 'none'
    CHECK (border_style IN ('none', 'solid', 'double')),
  border_width INTEGER NOT NULL DEFAULT 0
    CHECK (border_width >= 0 AND border_width <= 12),
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_custom_themes_slug ON custom_themes(slug);
CREATE INDEX idx_custom_themes_active ON custom_themes(is_active);
CREATE INDEX idx_custom_themes_sort ON custom_themes(sort_order);

ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON custom_themes FOR ALL USING (true);

-- Add custom_theme_meta column to card_requests
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS custom_theme_meta JSONB;
