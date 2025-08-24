-- Add code column to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE;

-- Update existing suppliers with codes
UPDATE public.suppliers SET code = 'S001' WHERE id = 1 AND code IS NULL;
UPDATE public.suppliers SET code = 'S002' WHERE id = 2 AND code IS NULL;
UPDATE public.suppliers SET code = 'S003' WHERE id = 3 AND code IS NULL;

-- Make code NOT NULL after setting values
ALTER TABLE public.suppliers ALTER COLUMN code SET NOT NULL;
