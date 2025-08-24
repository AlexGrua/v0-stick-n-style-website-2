-- Миграция SKU: добавление колонки sku в таблицу products
-- Выполнить в Supabase SQL Editor

BEGIN;

-- 1. Добавляем колонку SKU (если её нет)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- 2. Бэконим данные из JSONB в колонку
-- Проверяем разные возможные ключи в specifications
UPDATE public.products
   SET sku = COALESCE(
     specifications->>'sku',
     specifications->>'SKU',
     specifications->>'supplierId'
   )
 WHERE sku IS NULL
   AND specifications IS NOT NULL;

-- 3. Создаем уникальный индекс (частичный, для непустых значений)
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_notnull
  ON public.products (sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- 4. Обновляем кеш PostgREST
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
  'Products without SKU' as metric,
  count(*) as value
FROM public.products
WHERE sku IS NULL OR sku = '';
