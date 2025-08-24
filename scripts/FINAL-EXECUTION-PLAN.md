# 🚀 ФИНАЛЬНЫЙ ПЛАН ВЫПОЛНЕНИЯ

## 📋 ЧТО НУЖНО СДЕЛАТЬ (по порядку)

### Шаг 1: Принудительное обновление PostgREST кеша
1. **Откройте Supabase Console** → SQL Editor
2. **Выполните:**
```sql
-- Вариант 1: NOTIFY
NOTIFY pgrst, 'reload schema';

-- Вариант 2: pg_notify (на всякий случай)
SELECT pg_notify('pgrst', 'reload schema');
```

### Шаг 2: Перезапуск API в Supabase
1. **Откройте Supabase Console** → Project Settings
2. **Перейдите в раздел API**
3. **Нажмите "Restart"** (это самый "жесткий" сброс кеша)

### Шаг 3: Проверка exposed schemas
1. **В том же разделе API** проверьте "Exposed schemas"
2. **Убедитесь что там есть `public`** (и другие схемы где есть таблицы)

### Шаг 4: Перезапуск сервера разработки
```bash
# 1. Остановите сервер (Ctrl+C)
# 2. Запустите заново
npm run dev
```

### Шаг 5: Проверка результата
```bash
# Запустите проверку
node scripts/verify-after-fix.js
```

## 🧪 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

После выполнения всех шагов:

### ✅ Должно работать:
- `/rest/v1/subcategories?select=id,category_id,slug` → 200 OK
- `/api/subcategories` → 200 OK
- `/api/products` → 200 OK (без ошибок FK в логах)
- `/api/categories` → 200 OK (без ошибок FK в логах)

### ❌ Должно исчезнуть:
- Ошибки "Could not find a relationship" в логах
- Ошибки "Could not find the 'sku' column" при импорте
- 500 ошибки в `/api/subcategories`

## 🎯 ФИНАЛЬНАЯ ПРОВЕРКА

1. **Откройте админку** http://localhost:3001/admin/catalog
2. **Проверьте консоль браузера** - ошибки FK должны исчезнуть
3. **Попробуйте импорт продуктов** - должен работать без ошибок

## 🚨 ЕСЛИ ПРОБЛЕМА ОСТАЕТСЯ

### Проверьте права доступа:
```sql
-- В SQL Editor
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('products', 'categories', 'subcategories')
  AND grantee IN ('anon', 'service_role');
```

### Проверьте состояние БД:
```sql
-- В SQL Editor
SELECT to_regclass('public.subcategories');
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='products'
  AND column_name IN ('sku','subcategory_id','specifications');
```

## 📋 ЧЕКЛИСТ ВЫПОЛНЕНИЯ

- [ ] NOTIFY pgrst, 'reload schema' выполнен
- [ ] API в Supabase перезапущен
- [ ] Exposed schemas проверены (public есть)
- [ ] Сервер разработки перезапущен
- [ ] `node scripts/verify-after-fix.js` выполнен
- [ ] Ошибки FK исчезли из консоли браузера
- [ ] Импорт продуктов работает

## 🎉 ПОСЛЕ УСПЕШНОГО ВЫПОЛНЕНИЯ

**Миграция 001 полностью завершена!** 

- ✅ Схема базы данных обновлена
- ✅ PostgREST кеш обновлен
- ✅ API работает корректно
- ✅ Импорт продуктов готов к использованию

---

**Время выполнения:** ~5-10 минут  
**Статус:** 🚀 ГОТОВ К ВЫПОЛНЕНИЮ
