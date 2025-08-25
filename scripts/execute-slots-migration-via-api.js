async function executeSlotsMigrationViaAPI() {
  console.log('🚀 Выполняю миграцию слотов через API...')
  
  const sql = `
    -- Update default slot to 'left'
    ALTER TABLE public.page_blocks ALTER COLUMN slot SET DEFAULT 'left';

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
    UPDATE page_blocks SET slot='left' WHERE slot='main';
    UPDATE page_blocks SET slot='right' WHERE slot='aside';
  `

  try {
    console.log('📝 Отправляю SQL через API...')
    
    const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
      credentials: 'include'
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Миграция слотов выполнена успешно!')
      console.log('📊 Результат:', result)
    } else {
      console.log('❌ Ошибка миграции:', result)
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  }
}

executeSlotsMigrationViaAPI()
