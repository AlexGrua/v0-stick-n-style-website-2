-- =====================================================
-- ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ POSTGREST КЕША
-- =====================================================

-- 1. Принудительно обновляем кеш PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Проверяем что таблица subcategories существует
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'subcategories';

-- 3. Проверяем колонки в products
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('sku', 'subcategory_id', 'specifications');

-- 4. Проверяем FK связи
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
  AND tc.table_name IN ('products', 'subcategories');

-- 5. Проверяем демо-данные
SELECT 
  s.id,
  s.name,
  s.slug,
  c.name as category_name
FROM subcategories s
JOIN categories c ON s.category_id = c.id
LIMIT 5;

-- 6. Еще раз принудительно обновляем кеш
NOTIFY pgrst, 'reload schema';
