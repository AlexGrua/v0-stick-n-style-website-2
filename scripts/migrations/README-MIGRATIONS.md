# 📋 ИНСТРУКЦИИ ПО МИГРАЦИЯМ

## 🚨 ВАЖНО: После DDL операций

После выполнения любых DDL операций (CREATE, ALTER, DROP) **ОБЯЗАТЕЛЬНО** выполните:

### 1. Обновление PostgREST кеша
```sql
-- В конце каждой миграции
NOTIFY pgrst, 'reload schema';
```

### 2. Перезапуск API в Supabase
1. **Откройте Supabase Console** → Project Settings
2. **Перейдите в раздел API**
3. **Нажмите "Restart"** (жесткий сброс кеша)

### 3. Перезапуск сервера разработки
```bash
# Остановите сервер (Ctrl+C)
# Запустите заново
npm run dev
```

## 🔧 Проверка после миграции

### В SQL Editor:
```sql
-- Проверка существования таблиц
SELECT to_regclass('public.subcategories');

-- Проверка колонок
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='products'
  AND column_name IN ('sku','subcategory_id','specifications');
```

### В REST API:
```bash
# Проверка PostgREST
curl "https://your-project.supabase.co/rest/v1/subcategories?select=id,category_id,slug&limit=1" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### В приложении:
```bash
# Проверка API endpoints
node scripts/verify-after-fix.js
```

## 🚨 Частые проблемы

### 1. Exposed Schemas
**Проблема:** 500 ошибки на `/rest/v1/*`
**Решение:** Проверьте Settings → API → Exposed schemas - там должна быть `public`

### 2. Права доступа
**Проблема:** 401/500 ошибки
**Решение:** Убедитесь что роли `anon` и `service_role` имеют GRANT на новые таблицы

### 3. RLS политики
**Проблема:** 401 ошибки при включенном RLS
**Решение:** Временно отключите RLS или добавьте политики

### 4. Клиентский кеш
**Проблема:** Старые данные в UI
**Решение:** Очистите кеш SWR/React Query, перезапустите dev сервер

## 📋 Чеклист миграции

- [ ] DDL операции выполнены
- [ ] `NOTIFY pgrst, 'reload schema'` добавлен в миграцию
- [ ] API в Supabase перезапущен
- [ ] Сервер разработки перезапущен
- [ ] Exposed schemas проверены
- [ ] Права доступа настроены
- [ ] RLS политики настроены (если включен)
- [ ] Клиентский кеш очищен
- [ ] API endpoints протестированы
- [ ] Функциональность протестирована

## 🔄 CI/CD для миграций

### Smoke тест:
```bash
# 1. Поднять чистый PG
# 2. Прогнать миграции
# 3. Выполнить NOTIFY
# 4. Один GET на /rest/v1/subcategories
# 5. Проверить статус 200
```

## 📚 Полезные команды

```bash
# Проверка состояния БД
node scripts/check-migration-result.js

# Тестирование API
node scripts/test-api-endpoints.js

# Полная проверка после исправления
node scripts/verify-after-fix.js
```

---

**Запомните:** DDL → NOTIFY → Restart API → Restart Dev Server = ✅
