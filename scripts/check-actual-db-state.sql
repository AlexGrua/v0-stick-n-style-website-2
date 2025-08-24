-- Прямая проверка состояния базы данных
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем структуру таблицы products
SELECT 
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
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subcategories', 'categories', 'products', 'suppliers')
ORDER BY table_name;

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
  'Sample specifications' as metric,
  count(*) as value
FROM public.products
WHERE specifications ? 'sku';

-- 4. Проверяем дубликаты SKU (если колонка существует)
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

-- 5. Если колонка SKU существует, проверяем дубликаты
SELECT 
  'SKU duplicates check' as check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      AND column_name = 'sku'
    ) THEN (
      SELECT 
        sku, 
        count(*) as duplicates
      FROM public.products
      WHERE sku IS NOT NULL AND sku <> ''
      GROUP BY sku
      HAVING count(*) > 1
      ORDER BY count(*) DESC
      LIMIT 5
    )
    ELSE 'SKU column does not exist'
  END as result;
