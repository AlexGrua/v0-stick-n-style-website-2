-- Migration: Update Contact slots to top/left/right
-- Date: 2024-01-25

-- Update default slot to 'left'
ALTER TABLE public.page_blocks
  ALTER COLUMN slot SET DEFAULT 'left';

-- Map existing slots for contact page
WITH p AS (SELECT id FROM pages WHERE key='contact')
UPDATE page_blocks SET slot='top'
 WHERE page_id=(SELECT id FROM p) AND type='contactsHero';

WITH p AS (SELECT id FROM pages WHERE key='contact')
UPDATE page_blocks SET slot='left'
 WHERE page_id=(SELECT id FROM p) AND type='contactFormBlock';

WITH p AS (SELECT id FROM pages WHERE key='contact')
UPDATE page_blocks SET slot='right'
 WHERE page_id=(SELECT id FROM p) AND type='contactChannels';

-- Compatibility mapping for old slots
UPDATE page_blocks SET slot='left'  WHERE slot='main';
UPDATE page_blocks SET slot='right' WHERE slot='aside';

-- Normalize positions within each slot
WITH p AS (SELECT id FROM pages WHERE key = 'contact'),
     top_blocks AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) as rn
       FROM page_blocks 
       WHERE page_id = (SELECT id FROM p) AND slot = 'top'
     ),
     left_blocks AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) as rn
       FROM page_blocks 
       WHERE page_id = (SELECT id FROM p) AND slot = 'left'
     ),
     right_blocks AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) as rn
       FROM page_blocks 
       WHERE page_id = (SELECT id FROM p) AND slot = 'right'
     )
UPDATE page_blocks b
SET position = CASE 
  WHEN b.slot = 'top' THEN (tb.rn - 1) * 10
  WHEN b.slot = 'left' THEN (lb.rn - 1) * 10
  WHEN b.slot = 'right' THEN (rb.rn - 1) * 10
  ELSE b.position
END
FROM top_blocks tb, left_blocks lb, right_blocks rb
WHERE (b.id = tb.id OR b.id = lb.id OR b.id = rb.id);

