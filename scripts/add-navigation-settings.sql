-- Add default navigation settings to site_settings table
INSERT INTO site_settings (key, value) VALUES (
  'navigation',
  '{
    "mainMenu": [
      {"id": "home", "href": "/", "label": "Home", "visible": true, "order": 1, "type": "link"},
      {"id": "about", "href": "/about", "label": "About us", "visible": true, "order": 2, "type": "link"},
      {"id": "catalog", "href": "/catalog", "label": "Catalog", "visible": true, "order": 3, "type": "link"},
      {"id": "faqs", "href": "/faqs", "label": "FAQs", "visible": true, "order": 4, "type": "link"},
      {"id": "contact", "href": "/contact", "label": "Contact Us", "visible": true, "order": 5, "type": "link"}
    ],
    "showLanguageSwitcher": true,
    "showLoginButton": true,
    "showCartButton": true,
    "showCreateNOrder": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
