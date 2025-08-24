-- Создание таблиц для продуктов и категорий в Supabase
-- Эти таблицы будут хранить данные постоянно, не исчезая при деплое

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  technical_description TEXT,
  photos JSONB DEFAULT '{}'::jsonb,
  infographics JSONB DEFAULT '{}'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL,
  sub TEXT,
  thickness TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  pcs_per_box INTEGER DEFAULT 0,
  box_kg DECIMAL DEFAULT 0,
  box_m3 DECIMAL DEFAULT 0,
  min_order_boxes INTEGER DEFAULT 1,
  status TEXT DEFAULT 'inactive',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  stock_level INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставка дефолтных категорий
INSERT INTO categories (name, slug, subs) VALUES 
('Wall Panel', 'wall-panel', '[{"id": "1", "name": "Sub 1"}, {"id": "2", "name": "Sub 2"}, {"id": "3", "name": "Sub 3"}]'),
('Flooring', 'flooring', '[{"id": "4", "name": "Sub 1"}, {"id": "5", "name": "Sub 2"}, {"id": "6", "name": "Sub 3"}]'),
('Adhesive', 'adhesive', '[{"id": "7", "name": "Sub 1"}, {"id": "8", "name": "Sub 2"}]'),
('Accessories', 'accessories', '[{"id": "9", "name": "Sub 1"}, {"id": "10", "name": "Sub 2"}, {"id": "11", "name": "Sub 3"}]')
ON CONFLICT (slug) DO NOTHING;

-- Вставка дефолтных продуктов
INSERT INTO products (sku, name, category, sub, thumbnail_url, technical_description) VALUES 
('WP-001', 'A4', 'wall-panel', 'Sub 1', '/simple-wooden-panel.png', 'High-quality finish suitable for interiors.'),
('WP-002', 'A5', 'wall-panel', 'Sub 2', '/simple-wooden-panel.png', 'High-quality finish suitable for interiors.'),
('FL-001', 'Oak Prime', 'flooring', 'Sub 1', '/interior-flooring.png', 'High-quality finish suitable for interiors.'),
('AD-001', 'Metro Tile', 'adhesive', 'Sub 1', '/decorative-tile.png', 'High-quality finish suitable for interiors.')
ON CONFLICT (sku) DO NOTHING;
