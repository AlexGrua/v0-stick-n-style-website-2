-- Проверка дубликатов SKU перед созданием уникального индекса
-- Выполнить ДО создания уникального индекса

-- 1) Проверяем дубликаты в существующих данных
select 
  sku, 
  count(*) as duplicates,
  array_agg(id) as product_ids
from public.products
where sku is not null and sku <> ''
group by sku
having count(*) > 1
order by count(*) desc;

-- 2) Проверяем данные в JSONB specifications
select 
  specifications->>'sku' as jsonb_sku,
  count(*) as count
from public.products
where specifications ? 'sku'
group by specifications->>'sku'
having count(*) > 1
order by count(*) desc;

-- 3) Сравниваем данные в колонке vs JSONB
select 
  'Column SKU' as source,
  count(*) as total,
  count(distinct sku) as unique_skus,
  count(*) - count(distinct sku) as duplicates
from public.products
where sku is not null and sku <> ''
union all
select 
  'JSONB SKU' as source,
  count(*) as total,
  count(distinct specifications->>'sku') as unique_skus,
  count(*) - count(distinct specifications->>'sku') as duplicates
from public.products
where specifications ? 'sku';
