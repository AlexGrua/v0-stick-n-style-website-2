-- Обновляю флаги языков на SVG пазлы и исправляю настройки видимости
UPDATE languages 
SET flag_icon = CASE 
  WHEN code = 'en' THEN '/images/lang/us-flag-puzzle.svg'
  WHEN code = 'zh' THEN '/images/lang/china-flag-puzzle.svg'
  WHEN code = 'es' THEN '/images/lang/spain-flag-puzzle.svg'
  WHEN code = 'ru' THEN '/images/lang/russia-flag-puzzle.svg'
  ELSE flag_icon
END
WHERE code IN ('en', 'zh', 'es', 'ru');

-- Исправляю настройку видимости языкового переключателя
UPDATE site_settings 
SET data = '{"visible": false}'::jsonb
WHERE key = 'language_switcher_visible';

-- Если записи нет, создаю её
INSERT INTO site_settings (key, data, created_at, updated_at)
SELECT 'language_switcher_visible', '{"visible": false}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM site_settings WHERE key = 'language_switcher_visible'
);
