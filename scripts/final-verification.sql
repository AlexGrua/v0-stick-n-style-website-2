-- Финальная проверка состояния после миграции SKU
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем структуру таблицы products
SELECT
  'Products table structure' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Проверяем уникальный индекс на SKU
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

-- 3. Проверяем данные в products
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

-- 4. Проверяем данные в categories
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

-- 5. Показываем несколько примеров продуктов с SKU
SELECT
  'Sample products with SKU' as check,
  id,
  name,
  sku,
  specifications->>'supplierId' as supplier_id_from_json
FROM public.products
WHERE sku IS NOT NULL AND sku <> ''
ORDER BY id
LIMIT 10;

-- 6. Проверяем, что нет дубликатов SKU
SELECT
  'SKU duplicates check' as check,
  CASE
    WHEN EXISTS (
      SELECT sku
      FROM public.products
      WHERE sku IS NOT NULL AND sku <> ''
      GROUP BY sku
      HAVING COUNT(*) > 1
    ) THEN 'DUPLICATES FOUND'
    ELSE 'NO DUPLICATES'
  END as result;

-- 7. Показываем несколько примеров категорий
SELECT
  'Sample categories' as check,
  id,
  name,
  slug,
  jsonb_array_length(subs) as subs_count
FROM public.categories
ORDER BY id
LIMIT 5;
