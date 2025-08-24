-- Альтернативное исправление дубликатов SKU (добавление суффиксов)
-- Выполнить в Supabase SQL Editor

BEGIN;

-- 1. Проверяем дубликаты SKU
SELECT 
  'Checking duplicates' as step,
  sku, 
  count(*) as duplicates,
  array_agg(id) as product_ids
FROM public.products
WHERE sku IS NOT NULL AND sku <> ''
GROUP BY sku
HAVING count(*) > 1
ORDER BY count(*) DESC;

-- 2. Для дубликатов добавляем суффикс _1, _2, _3 и т.д.
-- Создаем временную таблицу для хранения новых SKU
CREATE TEMP TABLE sku_updates AS
WITH duplicates AS (
  SELECT 
    id,
    sku,
    ROW_NUMBER() OVER (PARTITION BY sku ORDER BY id) as rn
  FROM public.products
  WHERE sku IS NOT NULL AND sku <> ''
),
duplicate_skus AS (
  SELECT sku
  FROM public.products
  WHERE sku IS NOT NULL AND sku <> ''
  GROUP BY sku
  HAVING COUNT(*) > 1
)
SELECT 
  d.id,
  CASE 
    WHEN d.rn = 1 THEN d.sku
    ELSE d.sku || '_' || (d.rn - 1)
  END as new_sku
FROM duplicates d
INNER JOIN duplicate_skus ds ON d.sku = ds.sku;

-- 3. Обновляем SKU с дубликатами
UPDATE public.products 
SET sku = sku_updates.new_sku
FROM sku_updates
WHERE public.products.id = sku_updates.id;

-- 4. Проверяем, что дубликаты устранены
SELECT 
  'After cleanup' as step,
  sku, 
  count(*) as duplicates
FROM public.products
WHERE sku IS NOT NULL AND sku <> ''
GROUP BY sku
HAVING count(*) > 1
ORDER BY count(*) DESC;

-- 5. Теперь создаем уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_notnull
  ON public.products (sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- 6. Обновляем кеш PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Проверяем результат
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

-- Показываем обновленные SKU
SELECT 
  id,
  name,
  sku
FROM public.products
WHERE sku LIKE '%_%'
ORDER BY sku;
