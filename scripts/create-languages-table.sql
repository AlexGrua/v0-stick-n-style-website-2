-- Create languages table for multilingual support
CREATE TABLE IF NOT EXISTS languages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  flag_icon VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default languages
INSERT INTO languages (code, name, native_name, flag_icon, is_active, is_default) VALUES
('en', 'English', 'English', '🇺🇸', true, true),
('zh', 'Chinese', '中文', '🇨🇳', true, false),
('es', 'Spanish', 'Español', '🇪🇸', true, false),
('ru', 'Russian', 'Русский', '🇷🇺', true, false)
ON CONFLICT (code) DO NOTHING;

-- Create site settings for language switcher visibility
INSERT INTO site_settings (key, data) VALUES
('language_switcher_visible', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Create policies for languages table
CREATE POLICY "Allow public read access to active languages" ON languages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to languages" ON languages
  FOR ALL USING (auth.role() = 'authenticated');
