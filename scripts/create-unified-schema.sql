-- =====================================================
-- ЕДИНАЯ ЭТАЛОННАЯ СХЕМА БАЗЫ ДАННЫХ
-- =====================================================
-- Этот файл является ОБРАЗЦОМ для всей системы
-- Все API, импорт/экспорт и фронтенд должны работать с этой схемой
-- =====================================================

-- Удаляем старые таблицы если они существуют (для чистой установки)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- =====================================================
-- ТАБЛИЦА ПОСТАВЩИКОВ
-- =====================================================
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА КАТЕГОРИЙ
-- =====================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА ПОДКАТЕГОРИЙ
-- =====================================================
CREATE TABLE subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- =====================================================
-- ТАБЛИЦА ПРОДУКТОВ
-- =====================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  subcategory_id INTEGER REFERENCES subcategories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  image_url TEXT,
  price DECIMAL(10,2),
  in_stock BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  -- Все дополнительные данные в JSONB
  specifications JSONB DEFAULT '{}'::jsonb,
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_specifications_gin ON products USING GIN (specifications);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ ОБНОВЛЕНИЯ updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ДЕМО-ДАННЫЕ
-- =====================================================

-- Поставщики
INSERT INTO suppliers (code, name, contact_person, email, phone) VALUES
('S001', 'ООО "СтройМатериалы"', 'Иванов И.И.', 'ivanov@stroymat.ru', '+7-495-123-45-67'),
('S002', 'ТД "Декор Плюс"', 'Петров П.П.', 'petrov@decorplus.ru', '+7-495-234-56-78'),
('S003', 'Компания "ПолПро"', 'Сидоров С.С.', 'sidorov@polpro.ru', '+7-495-345-67-89');

-- Категории
INSERT INTO categories (name, slug, description, image_url) VALUES
('Wall Panel', 'wall-panel', 'Декоративные панели для стен', '/stone-brick-wall-panels.png'),
('Flooring', 'flooring', 'Напольные покрытия', '/wood-flooring-textures.png'),
('Adhesive', 'adhesive', 'Клеевые составы', '/decorative-tile.png'),
('Accessories', 'accessories', 'Аксессуары и комплектующие', '/modern-interior-3d-panels.png');

-- Подкатегории
INSERT INTO subcategories (category_id, name, slug, description) VALUES
(1, 'Plain Color', 'plain-color', 'Однотонные панели'),
(1, 'Brick Structure', 'brick-structure', 'Панели с текстурой кирпича'),
(1, '3D Panels', '3d-panels', 'Объемные панели'),
(2, 'Laminate', 'laminate', 'Ламинат'),
(2, 'Parquet', 'parquet', 'Паркет'),
(3, 'Tile Adhesive', 'tile-adhesive', 'Клей для плитки'),
(4, 'Installation', 'installation', 'Монтажные материалы');

-- Демо-продукты
INSERT INTO products (sku, name, description, category_id, subcategory_id, supplier_id, image_url, price, specifications) VALUES
('WP-001', 'A4 Plain Panel', 'Однотонная панель A4', 1, 1, 1, '/simple-wooden-panel.png', 2500.00, 
  '{"sku": "WP-001", "status": "active", "technicalSpecifications": [{"size": "60x60cm", "thicknesses": [{"thickness": "2mm", "pcsPerBox": 50}]}], "colorVariants": [{"name": "White", "colorCode": "WHITE", "image": "/white-panel.jpg"}]}'),
('WP-002', 'Brick Panel Classic', 'Панель с текстурой кирпича', 1, 2, 2, '/stone-brick-wall-panels.png', 3200.00,
  '{"sku": "WP-002", "status": "active", "technicalSpecifications": [{"size": "60x30cm", "thicknesses": [{"thickness": "3mm", "pcsPerBox": 30}]}], "colorVariants": [{"name": "Red Brick", "colorCode": "RED_BRICK", "image": "/red-brick.jpg"}]}'),
('FL-001', 'Oak Prime Laminate', 'Ламинат премиум класса', 2, 4, 1, '/wood-flooring-textures.png', 1800.00,
  '{"sku": "FL-001", "status": "active", "technicalSpecifications": [{"size": "1380x193mm", "thicknesses": [{"thickness": "12mm", "pcsPerBox": 8}]}], "colorVariants": [{"name": "Natural Oak", "colorCode": "NATURAL_OAK", "image": "/oak-laminate.jpg"}]}');

-- =====================================================
-- КОММЕНТАРИИ К СТРУКТУРЕ
-- =====================================================
COMMENT ON TABLE products IS 'Основная таблица продуктов с единой структурой';
COMMENT ON COLUMN products.specifications IS 'JSONB поле для всех дополнительных данных: технические характеристики, цветовые варианты, спецификации и т.д.';
COMMENT ON COLUMN products.category_id IS 'Ссылка на категорию (обязательное поле)';
COMMENT ON COLUMN products.subcategory_id IS 'Ссылка на подкатегорию (опциональное поле)';
COMMENT ON COLUMN products.supplier_id IS 'Ссылка на поставщика (опциональное поле)';

-- =====================================================
-- ПРАВИЛА ИМЕНОВАНИЯ
-- =====================================================
-- 1. Все ID - INTEGER (SERIAL PRIMARY KEY)
-- 2. Все связи через FOREIGN KEY
-- 3. Дополнительные данные в specifications JSONB
-- 4. Единообразные имена: category_id, subcategory_id, supplier_id
-- 5. SKU - уникальный идентификатор продукта
-- =====================================================
