-- Create table for home page data
CREATE TABLE IF NOT EXISTS home_page_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL,
  block_data JSONB NOT NULL,
  block_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_home_page_data_block_type ON home_page_data(block_type);
CREATE INDEX IF NOT EXISTS idx_home_page_data_block_order ON home_page_data(block_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Insert default categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Стеновые панели', 'wall-panels', 'Декоративные панели для стен', '/stone-brick-wall-panels.png'),
('Напольные покрытия', 'flooring', 'Ламинат, паркет и другие покрытия', '/wood-flooring-textures.png'),
('Потолочные системы', 'ceiling-systems', 'Подвесные и натяжные потолки', '/modern-interior-3d-panels.png'),
('Текстильные панели', 'textile-panels', 'Мягкие панели с тканевой отделкой', '/fabric-texture-wall-panels.png')
ON CONFLICT (slug) DO NOTHING;

-- Insert default products
INSERT INTO products (name, slug, description, price, image_url, category_id, is_featured) VALUES
('3D Панели "Кирпич"', '3d-brick-panels', 'Объемные панели с текстурой кирпича', 2500.00, '/stone-brick-wall-panels.png', 
  (SELECT id FROM categories WHERE slug = 'wall-panels'), true),
('Ламинат "Дуб классик"', 'oak-classic-laminate', 'Влагостойкий ламинат с текстурой дуба', 1800.00, '/wood-flooring-textures.png',
  (SELECT id FROM categories WHERE slug = 'flooring'), true),
('Панели "Модерн"', 'modern-panels', 'Современные декоративные панели', 3200.00, '/modern-interior-3d-panels.png',
  (SELECT id FROM categories WHERE slug = 'wall-panels'), true),
('Текстильные панели "Комфорт"', 'comfort-textile-panels', 'Мягкие панели с звукоизоляцией', 4500.00, '/fabric-texture-wall-panels.png',
  (SELECT id FROM categories WHERE slug = 'textile-panels'), true)
ON CONFLICT (slug) DO NOTHING;
