-- Create site_settings table for storing page data
CREATE TABLE IF NOT EXISTS public.site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Insert default data for pages
INSERT INTO public.site_settings (key, data) VALUES 
('about', '{
    "title": "About Us",
    "seoTitle": "About Us - Stick''N''Style",
    "heroTitle": "About Stick''N''Style",
    "companyStory": "Founded with a passion for innovative interior design, Stick''N''Style has been at the forefront of premium wall panel and flooring solutions.",
    "mission": "To provide high-quality, innovative interior solutions that transform spaces and exceed customer expectations."
}'),
('contact', '{
    "title": "Contact Us",
    "seoTitle": "Contact Us - Stick''N''Style",
    "heroTitle": "Get in Touch",
    "description": "We''d love to hear from you. Contact us for any questions about our products or services.",
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "address": "123 Design Street, Interior City, IC 12345"
}'),
('catalog', '{
    "title": "Catalog",
    "seoTitle": "Product Catalog - Stick''N''Style",
    "heroTitle": "Our Product Catalog",
    "description": "Explore our comprehensive range of premium wall panels and flooring solutions.",
    "featuredCategories": []
}'),
('footer', '{
    "companyName": "Stick''N''Style",
    "description": "Premium wall panels and flooring solutions for modern interiors.",
    "contactInfo": {
        "phone": "+1 (555) 123-4567",
        "email": "info@sticknstyle.com",
        "address": "123 Design Street, Interior City, IC 12345"
    },
    "quickLinks": [
        {"name": "Home", "url": "/"},
        {"name": "Catalog", "url": "/catalog"},
        {"name": "About Us", "url": "/about"},
        {"name": "Contact", "url": "/contact"}
    ],
    "socialLinks": [
        {"name": "Facebook", "url": "#"},
        {"name": "Instagram", "url": "#"},
        {"name": "LinkedIn", "url": "#"}
    ],
    "copyright": "© 2024 Stick''N''Style. All rights reserved."
}')
ON CONFLICT (key) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON public.site_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
