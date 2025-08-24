-- =====================================================
-- ИСПРАВЛЕНИЕ SUBCATEGORIES
-- =====================================================

BEGIN;

-- 1. Удаляем кривые subcategories если они есть
DROP TABLE IF EXISTS subcategories CASCADE;

-- 2. Создаем subcategories правильно
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

-- 3. Добавляем недостающие колонки в products если их нет
ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4. Добавляем FK для subcategory_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
      AND table_name = 'products' 
      AND constraint_name = 'products_subcategory_fk'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_subcategory_fk 
      FOREIGN KEY (subcategory_id) 
      REFERENCES subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);

-- 6. Отключаем RLS для админки
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- 7. Добавляем демо-данные
INSERT INTO subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Plain Color',
  'plain-color',
  'Однотонные панели'
FROM categories c 
WHERE c.name = 'Wall Panel';

INSERT INTO subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Brick Structure',
  'brick-structure',
  'Панели с текстурой кирпича'
FROM categories c 
WHERE c.name = 'Wall Panel';

-- 8. Добавляем демо-продукт для тестирования
INSERT INTO products (
  sku, 
  name, 
  description, 
  category_id, 
  subcategory_id, 
  supplier_id, 
  image_url, 
  price, 
  in_stock, 
  slug, 
  specifications
) 
SELECT 
  'DEMO-001',
  'Демо панель',
  'Тестовая панель для проверки',
  c.id,
  sc.id,
  s.id,
  'https://via.placeholder.com/300x200',
  1000,
  true,
  'demo-panel',
  '{"status": "active", "colorVariants": [{"name": "Белый", "code": "WHITE"}]}'::jsonb
FROM categories c
JOIN subcategories sc ON sc.category_id = c.id
JOIN suppliers s ON s.code = 'S001'
WHERE c.name = 'Wall Panel' 
  AND sc.name = 'Plain Color'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DEMO-001');

COMMIT;

-- 9. Обновляем кеш PostgREST
NOTIFY pgrst, 'reload schema';
