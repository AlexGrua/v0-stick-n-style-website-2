-- =====================================================
-- ПРОВЕРКА МИГРАЦИИ 001 - ВАЛИДАЦИЯ
-- =====================================================

-- 1. Проверяем что колонки добавлены в products
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('sku', 'subcategory_id', 'specifications')
ORDER BY column_name;

-- 2. Проверяем что таблица subcategories создана
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'subcategories';

-- 3. Проверяем FK связи
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products';

-- 4. Проверяем индексы
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'subcategories')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. Проверяем демо-данные (если есть)
SELECT 
  s.id,
  s.name,
  s.slug,
  c.name as category_name
FROM subcategories s
JOIN categories c ON s.category_id = c.id
LIMIT 5;

-- 6. Проверяем что RLS отключен (для админки)
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('products', 'categories', 'subcategories', 'suppliers')
ORDER BY tablename;
