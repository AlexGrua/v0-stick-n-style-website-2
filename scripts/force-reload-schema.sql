-- Принудительное обновление кеша PostgREST
-- Выполнить в Supabase SQL Editor

-- 1. Отправляем уведомление о перезагрузке схемы
NOTIFY pgrst, 'reload schema';

-- 2. Проверяем, что уведомление отправлено
SELECT pg_notify('pgrst','reload schema');

-- 3. Проверяем текущую схему products
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Проверяем, что колонка sku существует
SELECT 
  'SKU column exists' as check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products'
      AND table_schema = 'public'
      AND column_name = 'sku'
    ) THEN 'YES'
    ELSE 'NO'
  END as result;

-- 5. Проверяем уникальный индекс
SELECT 
  'SKU unique index exists' as check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'products'
      AND indexname = 'products_sku_unique_notnull'
    ) THEN 'YES'
    ELSE 'NO'
  END as result;
