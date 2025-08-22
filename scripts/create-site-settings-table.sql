-- Create site_settings table for storing footer and other site-wide settings
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default footer data if it doesn't exist
INSERT INTO site_settings (key, value) VALUES (
  'footer',
  '{
    "contact": {
      "address": "Shenzhen, China",
      "phone": "+86 123 456 789",
      "email": "hello@sticknstyle.com"
    },
    "socialMedia": {
      "whatsapp": "",
      "telegram": "",
      "wechat": "",
      "instagram": ""
    },
    "quickLinks": ["FAQs", "Shipping & Logistics", "Quality & Warranty", "Become a Partner"],
    "inquiryForm": {
      "title": "Mini inquiry",
      "phonePlaceholder": "Phone or Email",
      "questionPlaceholder": "Your question",
      "buttonText": "Send"
    },
    "copyright": "Stick''N''Style. All rights reserved.",
    "messengerWidget": "Embedded messenger widget placeholder"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
