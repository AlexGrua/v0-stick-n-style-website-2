-- Add subs column to categories table to store subcategories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS subs JSONB DEFAULT '[]'::jsonb;

-- Update existing categories to have empty subs array if null
UPDATE categories SET subs = '[]'::jsonb WHERE subs IS NULL;
