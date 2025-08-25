-- Нормализация блоков Contact страницы
-- Включаем блоки по умолчанию
UPDATE page_blocks
SET is_active = true
WHERE page_id = (SELECT id FROM pages WHERE key='contact')
  AND type IN ('contactsHero','contactFormBlock','contactChannels')
  AND COALESCE(is_active,false) = false;

-- Нормализуем позиции: 0,10,20...
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(position,999999), id) AS rn
  FROM page_blocks
  WHERE page_id = (SELECT id FROM pages WHERE key='contact')
)
UPDATE page_blocks p
SET position = (o.rn - 1) * 10
FROM ordered o
WHERE p.id = o.id;

-- Проверяем результат
SELECT 
  type,
  position,
  is_active,
  props
FROM page_blocks 
WHERE page_id = (SELECT id FROM pages WHERE key='contact')
ORDER BY position;

