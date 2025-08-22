-- Удаляю все старые записи Language Switcher из site_settings
DELETE FROM site_settings WHERE key IN ('language_switcher_visible', 'language_switcher_visibility');

-- Обновляю navigation data чтобы включить showLanguageSwitcher по умолчанию
UPDATE site_settings 
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb), 
  '{showLanguageSwitcher}', 
  'true'::jsonb
)
WHERE key = 'navigation';

-- Если записи navigation нет, создаю её с базовыми настройками
INSERT INTO site_settings (key, data, created_at, updated_at)
SELECT 'navigation', 
       '{"showLanguageSwitcher": true, "showLoginButton": true, "showCartButton": true}'::jsonb,
       NOW(),
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'navigation');
