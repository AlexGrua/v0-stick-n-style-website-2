-- Проверка состояния колонки SKU
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем, существует ли колонка sku
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

-- 2. Если колонка существует, показываем её свойства
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name = 'sku';

-- 3. Проверяем данные в products
SELECT 
  'Total products' as metric,
  count(*) as value
FROM public.products
UNION ALL
SELECT 
  'Products with specifications' as metric,
  count(*) as value
FROM public.products
WHERE specifications is not null
UNION ALL
SELECT 
  'Sample specifications with SKU' as metric,
  count(*) as value
FROM public.products
WHERE specifications ? 'sku';

-- 4. Показываем пример данных из specifications
SELECT 
  id,
  name,
  specifications->>'sku' as sku_from_json,
  specifications->>'supplierId' as supplier_id_from_json
FROM public.products
WHERE specifications IS NOT NULL
LIMIT 5;
