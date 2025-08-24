-- Проверка финального состояния базы данных
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем структуру таблицы products
SELECT
  'Products table structure' as check,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Проверяем существование таблицы subcategories
SELECT
  'Subcategories table exists' as check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'subcategories'
    ) THEN 'YES'
    ELSE 'NO'
  END as result;

-- 3. Проверяем уникальный индекс на SKU
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

-- 4. Проверяем данные в products
SELECT
  'Total products' as metric,
  count(*) as value
FROM public.products
UNION ALL
SELECT
  'Products with SKU' as metric,
  count(*) as value
FROM public.products
WHERE sku IS NOT NULL AND sku <> ''
UNION ALL
SELECT
  'Unique SKUs' as metric,
  count(DISTINCT sku) as value
FROM public.products
WHERE sku IS NOT NULL AND sku <> '';

-- 5. Проверяем данные в categories
SELECT
  'Total categories' as metric,
  count(*) as value
FROM public.categories
UNION ALL
SELECT
  'Categories with subs' as metric,
  count(*) as value
FROM public.categories
WHERE subs IS NOT NULL AND jsonb_array_length(subs) > 0;

-- 6. Проверяем данные в subcategories (если таблица существует)
SELECT
  'Total subcategories' as metric,
  count(*) as value
FROM public.subcategories;

-- 7. Показываем несколько примеров продуктов
SELECT
  'Sample products' as check,
  id,
  name,
  sku,
  specifications->>'supplier id' as supplier_id_from_json
FROM public.products
LIMIT 5;

-- 8. Показываем несколько примеров категорий
SELECT
  'Sample categories' as check,
  id,
  name,
  slug,
  jsonb_array_length(subs) as subs_count
FROM public.categories
LIMIT 5;
