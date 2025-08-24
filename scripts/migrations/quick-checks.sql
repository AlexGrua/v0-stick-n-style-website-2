-- =====================================================
-- БЫСТРЫЕ ПРОВЕРКИ ПОСЛЕ МИГРАЦИИ 001
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

-- 2. Проверяем что таблица subcategories существует
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

-- 7. Тестовый INSERT в subcategories (если нужно)
-- INSERT INTO subcategories (category_id, name, slug, description) 
-- SELECT 
--   c.id,
--   'Test Subcategory',
--   'test-subcategory',
--   'Тестовая подкатегория'
-- FROM categories c 
-- WHERE c.name = 'Wall Panel' 
--   AND NOT EXISTS (
--     SELECT 1 FROM subcategories sc 
--     WHERE sc.category_id = c.id AND sc.name = 'Test Subcategory'
--   );

-- 8. Проверяем что PostgREST кеш обновился
-- (Это делается автоматически через NOTIFY pgrst, 'reload schema')
-- Можно проверить через API запросы

-- =====================================================
-- ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:
-- =====================================================
-- 
-- 1. Должны быть 3 колонки: sku (text, nullable), 
--    subcategory_id (integer, nullable), 
--    specifications (jsonb, not null, default '{}')
--
-- 2. Таблица subcategories должна существовать
--
-- 3. Должен быть FK products_subcategory_fk
--
-- 4. Должны быть индексы: idx_products_sku, 
--    idx_products_subcategory_id, idx_subcategories_category_id,
--    idx_products_specifications_gin
--
-- 5. Должны быть демо-данные (если dev окружение)
--
-- 6. RLS должен быть отключен (rowsecurity = false)
--
-- =====================================================
