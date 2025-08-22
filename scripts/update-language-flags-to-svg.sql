-- Update existing languages to use SVG puzzle flags instead of emoji
UPDATE languages 
SET flag_icon = '/images/lang/us-flag-puzzle.svg' 
WHERE code = 'en';

UPDATE languages 
SET flag_icon = '/images/lang/china-flag-puzzle.svg' 
WHERE code = 'zh';

UPDATE languages 
SET flag_icon = '/images/lang/russia-flag-puzzle.svg' 
WHERE code = 'ru';

UPDATE languages 
SET flag_icon = '/images/lang/spain-flag-puzzle.svg' 
WHERE code = 'es';

-- Add console output to verify updates
SELECT code, name, flag_icon, is_active FROM languages ORDER BY code;
