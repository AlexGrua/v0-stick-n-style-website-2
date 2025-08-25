-- Migration: Add slots for Contact two-column layout
-- Date: 2024-01-25

-- Add slot column to page_blocks
ALTER TABLE public.page_blocks
  ADD COLUMN IF NOT EXISTS slot text NOT NULL DEFAULT 'main';

-- Create index for ordering inside slot
CREATE INDEX IF NOT EXISTS page_blocks_page_slot_pos_idx
  ON public.page_blocks (page_id, slot, position);

-- Backfill: move contactChannels to 'aside' slot on /contact page
WITH p AS (SELECT id FROM pages WHERE key = 'contact')
UPDATE page_blocks b
SET slot = 'aside'
WHERE b.page_id = (SELECT id FROM p) AND b.type = 'contactChannels';

-- Ensure other contact blocks are in 'main' slot
WITH p AS (SELECT id FROM pages WHERE key = 'contact')
UPDATE page_blocks b
SET slot = 'main'
WHERE b.page_id = (SELECT id FROM p) 
  AND b.type IN ('contactsHero', 'contactFormBlock')
  AND (b.slot IS NULL OR b.slot = 'main');

-- Normalize positions within each slot
WITH p AS (SELECT id FROM pages WHERE key = 'contact'),
     main_blocks AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) as rn
       FROM page_blocks 
       WHERE page_id = (SELECT id FROM p) AND slot = 'main'
     ),
     aside_blocks AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) as rn
       FROM page_blocks 
       WHERE page_id = (SELECT id FROM p) AND slot = 'aside'
     )
UPDATE page_blocks b
SET position = CASE 
  WHEN b.slot = 'main' THEN (mb.rn - 1) * 10
  WHEN b.slot = 'aside' THEN (ab.rn - 1) * 10
  ELSE b.position
END
FROM main_blocks mb, aside_blocks ab
WHERE (b.id = mb.id OR b.id = ab.id);

-- Add RLS policy for slot column
ALTER POLICY "Enable read access for all users" ON public.page_blocks
  USING (true);

-- Add RLS policy for authenticated users to update slot
ALTER POLICY "Enable update for authenticated users" ON public.page_blocks
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

