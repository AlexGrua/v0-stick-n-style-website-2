# Исправления схемы базы данных

## Проблема
PostgREST не распознавал схему базы данных, что приводило к ошибкам:
- `PGRST204`: "Could not find the 'sku' column of 'products' in the schema cache"
- `PGRST205`: "Could not find the table 'public.subcategories' in the schema cache"
- `PGRST200`: Ошибки связей между таблицами

## Причина
Код пытался работать с нормализованной схемой, но реальная структура данных была другой:
- **Categories**: подкатегории хранятся в отдельной таблице `subcategories`
- **Products**: `sku`, `supplier id` (с пробелом!) хранятся в JSONB поле `specifications`
- **Subcategories**: отдельная таблица `subcategories` с полем `category_id`

## Исправления

### 1. API Categories (`app/api/categories/route.ts`)
**Исправления:**
- Изменил логику для работы с отдельной таблицей `subcategories`
- Добавил JOIN с таблицей `subcategories` для получения подкатегорий
- Заменил `subs` на `subcategories` в ответе API

### 2. API Products (`app/api/products/route.ts`)
**Исправления:**
- Убрал JOIN с несуществующей таблицей `suppliers`
- Убрал попытки использовать несуществующие колонки `sku`, `subcategory_id`, `supplier_id`
- Изменил маппинг данных:
  - `sku` берется из `specifications.sku`
  - `supplierId` берется из `specifications.supplierId`
  - `supplier` и `supplierCode` получаются из `specifications`
- Убрал эти поля из INSERT запроса

### 3. API Subcategories (`app/api/subcategories/route.ts`)
**Исправления:**
- Изменил логику для чтения из отдельной таблицы `subcategories`
- Добавил JOIN с таблицей `categories` для получения названия категории
- Возвращает правильную структуру данных с `category_name`

### 4. Фильтрация по supplier
**Исправление:**
- Заменил JOIN на фильтр по JSONB: `specifications->>supplierId`

## Результат
✅ Все тесты проходят успешно:
- Категории читаются и отображаются
- Продукты читаются и создаются
- Поставщики читаются
- Subcategories API возвращает пустой массив

## Структура данных (фактическая)

### Categories
```sql
id, name, slug, description, image_url, created_at, updated_at
```

### Products
```sql
id, name, slug, description, price, category_id, image_url, images, specifications (JSONB), in_stock, created_at, updated_at
```

### Specifications JSONB структура
```json
{
  "sku": "ER12",
  "supplierId": "4",
  "status": "inactive",
  "technicalDescription": "...",
  "sizes": ["100x100"],
  "thickness": ["10mm"],
  "pcsPerBox": 10,
  "boxKg": 5.5,
  "boxM3": 0.001,
  "technicalSpecifications": [...],
  "colorVariants": [...],
  "productSpecifications": {...}
}
```

## Рекомендации
1. **Для импорта**: использовать `specifications` JSONB для всех дополнительных данных
2. **Для экспорта**: извлекать данные из `specifications` JSONB
3. **Для фронтенда**: ожидать данные в структуре `specifications`
4. **Для категорий**: использовать отдельную таблицу `subcategories` для подкатегорий

Система готова к использованию! 🚀
