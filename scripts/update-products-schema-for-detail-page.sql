-- Update products table schema for detailed product page
-- Add new columns for comprehensive product information

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color_variants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interior_applications jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS technical_specifications jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS installation_notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS material jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS usage jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS application jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS adhesion jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS physical_properties jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS suitable_surfaces jsonb DEFAULT '[]'::jsonb;

-- Update existing products with default values
UPDATE products 
SET 
  color_variants = COALESCE(color_variants, '[]'::jsonb),
  interior_applications = COALESCE(interior_applications, '[]'::jsonb),
  technical_specifications = COALESCE(technical_specifications, '{
    "size": "",
    "thickness": "",
    "pieces_per_box": "",
    "box_size": "",
    "weight": "",
    "volume": ""
  }'::jsonb),
  installation_notes = COALESCE(installation_notes, ''),
  material = COALESCE(material, '[]'::jsonb),
  usage = COALESCE(usage, '[]'::jsonb),
  application = COALESCE(application, '[]'::jsonb),
  adhesion = COALESCE(adhesion, '[]'::jsonb),
  physical_properties = COALESCE(physical_properties, '[]'::jsonb),
  suitable_surfaces = COALESCE(suitable_surfaces, '[]'::jsonb)
WHERE 
  color_variants IS NULL 
  OR interior_applications IS NULL 
  OR technical_specifications IS NULL 
  OR installation_notes IS NULL
  OR material IS NULL
  OR usage IS NULL
  OR application IS NULL
  OR adhesion IS NULL
  OR physical_properties IS NULL
  OR suitable_surfaces IS NULL;

-- Add comment to document the schema update
COMMENT ON COLUMN products.color_variants IS 'Array of color variants with name, image, and selected flag';
COMMENT ON COLUMN products.interior_applications IS 'Array of interior application images with titles and descriptions';
COMMENT ON COLUMN products.technical_specifications IS 'Object containing technical specs like size, thickness, weight, etc.';
COMMENT ON COLUMN products.installation_notes IS 'Text content for installation instructions';
COMMENT ON COLUMN products.material IS 'Array of materials (PVC, PET, etc.) with icons';
COMMENT ON COLUMN products.usage IS 'Array of usage types (Indoor, Outdoor) with icons';
COMMENT ON COLUMN products.application IS 'Array of applications (Kitchen, Bathroom, etc.) with icons';
COMMENT ON COLUMN products.adhesion IS 'Array of adhesion types (Self-adhesive, Non-adhesive) with icons';
COMMENT ON COLUMN products.physical_properties IS 'Array of physical properties (Fireproof, Soundproof, etc.) with icons';
COMMENT ON COLUMN products.suitable_surfaces IS 'Array of suitable surfaces (Concrete, Wallpaper, etc.) with icons';
