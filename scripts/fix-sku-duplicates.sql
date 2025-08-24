-- Исправление дубликатов SKU перед созданием уникального индекса
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

-- 2. Для каждого дубликата оставляем только один продукт (самый новый)
-- Удаляем дубликаты, оставляя продукт с максимальным id
DELETE FROM public.products 
WHERE id IN (
  SELECT p1.id
  FROM public.products p1
  INNER JOIN (
    SELECT sku, MAX(id) as max_id
    FROM public.products
    WHERE sku IS NOT NULL AND sku <> ''
    GROUP BY sku
    HAVING COUNT(*) > 1
  ) p2 ON p1.sku = p2.sku AND p1.id < p2.max_id
);

-- 3. Проверяем, что дубликаты устранены
SELECT 
  'After cleanup' as step,
  sku, 
  count(*) as duplicates
FROM public.products
WHERE sku IS NOT NULL AND sku <> ''
GROUP BY sku
HAVING count(*) > 1
ORDER BY count(*) DESC;

-- 4. Теперь создаем уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_notnull
  ON public.products (sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- 5. Обновляем кеш PostgREST
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
